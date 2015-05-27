// use the express middleware
//var express = require('express');

var express = require('express')
  , pg = require('pg').native
  , connectionString = process.env.DATABASE_URL
  , start = new Date()
  , port = process.env.PORT
  , client;

// make express handle JSON and other requests
var bodyParser = require('body-parser');

// use cross origin resource sharing
var cors = require('cors');

// instantiate app
var app = express();



var numberQuotes = 3;
var token = 0;   
validTokens = [];                                                                // LOCAL VARIABLE TO STORE NUMBER OF QUOTES STORED


client = new pg.Client(connectionString);
client.connect();

// make sure we can parse JSON passed in the body or encoded into url
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

// serve up files from this directory 
//app.use(express.static(__dirname));
// make sure we use CORS to avoid cross domain problems
app.use(cors());




//TODO TEST ALL METHODS IN ALL WAYS AMUCHAP
//ALL ERROR CHECKS AND PRECOND CHECKS
//FUTURE: LOCAL VARIABLES NOT GOOD PRACTICE INCASE SERVER CRASHES - THEY WILL BE RESET
//MODIFY OTHER METHODS TO USE THE TOKEN
// go through each api make sense? do what supposed to?
//random doesnt like query.on('end'){ client.end();}
// test post and delete methods







app.get('/quote/all', function(req,res) {                                         //ACCESS DATABASE AND RETURN ALL QUOTES HELD
  // precheck - are there quotes held?
  if(numberQuotes<=0){
    res.statusCode = 404;
    return res.send('There are no quotes to access!');
  }
  var results = [];
  // query - select all quotes from database
  query = client.query('SELECT * FROM quotes', function(error, result){
    // return psql error to client if it occurs
    if (error){
      res.statusCode = 500;
      return res.send('ERROR: '+ error.message);
    }
  });

  query.on('row', function(row) {
    // add all quotes from query to results array
    results.push(row);
  });

  query.on('end', function() {
    // when all results have been returned, return them to the client, using stringify() of json
    return res.send(JSON.stringify(results, null, 3)); client.end();

  });

});

app.get('/quote/random', function(req, res) {
  // precheck - are there quotes held?
  if(numberQuotes<=0){
    res.statusCode = 404;
    return res.send('There are no quotes to access!');
  }

  var key = Math.floor(Math.random() * numberQuotes);
    // query - select a random quote from database using a random number variable
  query = client.query('SELECT author, content FROM quotes q WHERE q.tablekey = $1', [key], function(error, result){
      // return psql error to client if it occurs
    if (error){
      res.statusCode = 500;
      return res.send('ERROR: '+ error.message);
    }
  });
  query.on('row', function(result) {
    if(!result){
      return res.send('cannot find random quote');
    }else{
          // when result has been returned, return them to the client
    res.send('author: '+ result.author +', quote:' + result.content);
    }
  });
  query.on('end', function() {
    // when all results have been returned, return them to the client, using stringify() of json
    client.end();

  });
});







app.get('/quote/:id', function(req, res) {
  //prechecks - id is valid
  if(req.params.id < 1) {
    res.statusCode = 404;
    return res.send('Error 404: No quote found, please note quotes index starts from ONE(1)');
  }
  if(req.params.id > numberQuotes){
    res.statusCode = 404;
    return res.send('Error 404: No quote found, please note quotes index starts from ONE(1)');
  }
      // query - select quote from database using a id variable provided in HTTP header
  query = client.query('SELECT author, content FROM quotes q WHERE q.tablekey = $1', [req.params.id], function(error, result){
          // return psql error to client if it occurs
    if (error){
      res.statusCode = 500;
      return res.send('ERROR: '+ error.message);
    }

  });
  query.on('row', function(result) {
    if(!result){
      return res.send('cannot find quote with this id');
    }else{
                // when result has been returned, return them to the client
    res.send('author: '+ result.author +', quote:' + result.content);
    }
  });
  query.on('end', function() {
    // when all results have been returned, return them to the client, using stringify() of json
    client.end();

  });
});



app.post('/quote', function(req, res) {
  //precheck - http header has enough information
  if(!req.body.hasOwnProperty('author') || !req.body.hasOwnProperty('text')) {
    res.statusCode = 400;
    return res.send('Error 400: Post syntax incorrect.');
  }

  var newQuote = {
    author : req.body.author,
    text : req.body.text
  };
        // query - insert quote into database using info provided by client in http header
  query = client.query('INSERT INTO quotes(author,content) VALUES($1,$2)', [newQuote.author,newQuote.text],function(error,result){
    if (error){
      res.statusCode = 500;
      return res.send('ERROR: '+ error.message);
    }

  });
  //locally update the number of quotes held in the database
  numberQuotes++;
  // inform the client of success
  res.send('added quote!');

    query.on('end', function() {
    // when all results have been returned, return them to the client, using stringify() of json
    client.end();

  });
});


//RESTful method for user login - post
app.post('/login',function(req,res){
  //precheck - http header has enough information
  if(!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password')) {
    res.statusCode = 400;
    return res.send('Error 400: Username or Password missing');
  }
  //prelim check for security - without accessing information, does this username even exist?
  query = client.query('SELECT username, password FROM users u WHERE u.username = $1 && u.password = $2', [req.params.username, req.params.password], function(error,result){
    if (error){
      res.statusCode = 500;
      return res.send('ERROR: '+ error.message);
    }
  });
  query.on('row',function(result){
    if(!result){
      res.statusCode = 400;
      return res.send('No user with this username exists, or the password is incorrect!');
    }
    else{
      if(result.loggedin == true){
        res.statusCode = 400;
        return res.send('this user is already logged in!');
      }
      else{
        var token = accessTokenUp();
        query2 = client.query('UPDATE users SET loggedin = true, accessToken = $1 WHERE username = $2', [token,req.params.username], function(error, result){
          if (error){
            res.statusCode = 500;
              return res.send('ERROR: '+ error.message);
          }
        });
        res.statusCode = 200;
        return res.send('Login successful!' + token);
        query2.on('end', function() {
          client.end();
        });
      }
    }
  });
  query.on('end', function() {
    // when all results have been returned, return them to the client, using stringify() of json
    client.end();
  });
});

app.post('/logout',function(req,res){
  if(!req.body.hasOwnProperty('token')) {
    res.statusCode = 400;
    return res.send('Error 400: Access token missing!');
  }
  //Check the clients provided access token is one of the valid access tokens
  if(!tokenAllowed(req.params.token)){
    res.statusCode = 400;
    return res.send('Invalid Access token!');
  }
  query = client.query('SELECT accessToken FROM users u WHERE u.accessToken = $1',[req.params.token],function(error,result){
    if (error){
      res.statusCode = 500;
      return res.send('ERROR: '+ error.message);
    }
  });
  query.on('row', function(result){
    if(!result){
      res.statusCode = 400;
      return res.send('User with this access token is not logged in!');
    }
    else{
      query2 = client.query('UPDATE users SET loggedin = false, accessToken = $1 WHERE accessToken = $2', [null,req.params.token], function(error, result){
      if (error){
        res.statusCode = 500;
        return res.send('ERROR: '+ error.message);
      }
      });
      res.statusCode = 200;
      return res.send('logout successful!');
      removeToken(req.params.token);
      query2.on('end', function() {
        client.end();
      });
    }
  });
  query.on('end', function() {
    client.end();
  });
});


app.get('/',function(req,res){
  res.sendFile('form.html');
});


app.post('/test',function(req,res){
  res.send(req.body.username + ',' + req.body.password);

});


function accessTokenUp(){
  temp = token;
  token++;
  return temp;
}

function tokenAllowed(token){
  return (validTokens.indexOf(token) != -1);
}

function removeToken(token){
  var remove = validTokens.indexOf(token);
  if(remove != -1) {
    validTokens.splice(i, 1);
  }
}




///////////////////////////////////
app.delete('/quote/:id', function(req, res) {
  //precheck - provided id is valid
  if(req.params.id < 1) {
    res.statusCode = 404;
    return res.send('Error 404: No quote found');
  }
  if(req.params.id > numberQuotes){
    res.statusCode = 404;
    return res.send('Error 404: No quote found');
  }
          // query - remove quote from database using id provided by client in http header
  query = client.query('DELETE FROM quotes WHERE tablekey = $1', [req.params.id],function(error,result){
    if (error){
      res.statusCode = 500;
      return res.send('ERROR: '+ error.message);
    }

  });
    //locally update the number of quotes held in the database
  numberQuotes--;
    // inform the client of success
  res.send('quote removed!');

    query.on('end', function() {
    // when all results have been returned, return them to the client, using stringify() of json
    client.end();

  });
});
///////////////////////////////////






// use PORT set as an environment variable
var server = app.listen(process.env.PORT, function() {
    console.log('Listening on port %d', server.address().port);
});

