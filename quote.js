var express = require('express');
var pg = require('pg').native;
var connectionString = process.env.DATABASE_URL;
var start = new Date();
var port = process.env.PORT;
var client;
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
var password = require('password-hash-and-salt');
var numberQuotes = 3;     
var path = require('path');                                                           
var randtoken = require('rand-token');



client = new pg.Client(connectionString);
client.connect();
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(express.static(__dirname +'/www'));
app.use(cors());




app.get('/quote/all', function(req,res) {                                        
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
});


app.get('/quote/:id', function(req, res) {
  //prechecks - id is valid
  if(req.params.id < 1 || req.params.id > numberQuotes) {
    res.statusCode = 404;
    return res.send('Error 404: No quote found');
  }
      // query - select quote from database using a id variable provided in HTTP header
  query = client.query('SELECT author, content FROM quotes q WHERE q.tablekey = $1', [req.params.id]);
  query.on('row', function(result) {
    if(!result){
      return res.send('cannot find quote with this id');
    }else{
                // when result has been returned, return them to the client
    res.send('author: '+ result.author +', quote:' + result.content);
    }
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
  query = client.query('INSERT INTO quotes(author,content) VALUES($1,$2)', [newQuote.author,newQuote.text]);
  //locally update the number of quotes held in the database
  numberQuotes++;
  // inform the client of success
  res.send('added quote!');

});

function rawToken(){
  var token = randtoken.generate(16);
  return token;
}


function giveMeAToken(given){

  var token = [];

  console.log('in giveMeAToken()');
  console.log('raw token is: '+given);
  password(given).hash(function(error, hash) {
  if(error){console.log('something went wrong!'); }

  token.hash = hash; 
  });

  console.log('token.hash = ' + token.hash);
  return token.hash;

}

function tokenAllowed(userToken){
  console.log('in tokenAllowed()');
  console.log('checkig provided token in database');
  console.log('here');
      query = client.query('SELECT accessToken FROM users u WHERE u.accessToken = $1',[userToken]);
      query.on('row', function(result){
        if(!result){
          console.log('This token does not exist!');
          return false;
        }
        console.log('results obtained, performing check');
        password(userToken).verifyAgainst(result.token, function(error, verified) {   
        if(!verified) {
          console.log('token has not been verified, returning false');
          return false;
        }else{
          console.log('token has been verified, returning true');
          return true;
        }
        });
      });
      query.on('end',function(){
        client.end();
      });

}






//RESTful method for user login - post
app.post('/login',function(req,res){
  console.log('starting logon');
  //precheck - http header has enough information
  if(!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password')) {
    res.statusCode = 400;
    return res.send('Error 400: Username or Password missing');
  }
  //prelim check for security - without accessing information, does this username even exist?
  query = client.query('SELECT Count(username) FROM users u WHERE u.username = $1 AND u.password = $2', [req.body.username, req.body.password], function(error,result){
    if (error){
      res.statusCode = 500;
      return res.send('ERROR: '+ error.message);
    }
  });
  query.on('row',function(result){
    console.log('accessed database');
    if(result.count == 0){
      console.log('no results found');
      res.statusCode = 400;
      return res.send('No user with this username exists, or the password is incorrect!');
    }
    else{
      console.log('database does contain this username password combonation');
      if(result.loggedin == true){
        console.log('this user is already logged in');
        res.statusCode = 400;
        return res.send('this user is already logged in!');
      }
      else{
        console.log('user is not logged in, generating a token');
        var token = giveMeAToken(rawToken());
        console.log('given username: '+ req.body.username);
        console.log('given password: '+ req.body.password);
        console.log('generated token from randgen token: '+ token);
        query2 = client.query('UPDATE users SET loggedin = true, accessToken = $1 WHERE username = $2', [token,req.body.username], function(error, result){
        console.log('user set to loggen on, hash token stored in their account');
          if (error){
            res.statusCode = 500;
              return res.send('ERROR: '+ error.message);
          }
        });
        console.log('login complete, returning user a token');
        res.statusCode = 200;
        res.send(token);
      }
    }
  });

});

app.post('/logout',function(req,res){
  console.log('attempting to log out');
  if(!req.body.hasOwnProperty('token')) {
    res.statusCode = 400;
    return res.send('Error 400: Access token missing!');
  }
  //Check the clients provided access token is one of the valid access tokens
  if(!tokenAllowed(req.body.token)){
    console.log('checking token is allowed');
    res.statusCode = 400;
    return res.send('Invalid Access token!');
  }
  console.log('token check complete, token allowed')
  query = client.query('SELECT Count(accessToken) FROM users u WHERE u.accessToken = $1',[req.body.token],function(error,result){
    if (error){
      res.statusCode = 500;
      return res.send('ERROR: '+ error.message);
    }
  });
  query.on('row', function(result){
    if(result.count == 0){
      console.log('this acces token does not exist');
      res.statusCode = 400;
      return res.send('User with this access token is not logged in!');
    }
    else{
      console.log('appropriate user account found, attempting to log out');
      query2 = client.query('UPDATE users SET loggedin = false, accessToken = $1 WHERE accessToken = $2', [null,req.body.token], function(error, result){
      console.log('user account set to logged out, access token set to null');
      if (error){
        res.statusCode = 500;
        return res.send('ERROR: '+ error.message);
      }
      });
      res.statusCode = 200;
      console.log('log out successful');
      return res.send('logout successful!');
      //remove token
    }
  });

});






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

});
///////////////////////////////////






// use PORT set as an environment variable
var server = app.listen(process.env.PORT, function() {
    console.log('Listening on port %d', server.address().port);
});

