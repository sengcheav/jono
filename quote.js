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



function giveMeAToken(given){
  var token = randtoken.generate(16);
  query = client.query('INSERT INTO validTokens(token) VALUES($1)', [given]);
  query.on('end',function(){
    client.end();
  });
  return token;
}

function tokenAllowed(given){
  var ok;
  query = client.query('SELECT COUNT(token) FROM validTokens v WHERE v.token = $1',[given]);
  query.on('row', function(result){
    if(result.count ==  0){
      console.log('This token does not exist!');
      ok = false;
    }
    ok = true;
  });
  query.on('end',function(){
    client.end();
    return ok;
  });

}

function removeActiveToken(given){
  query = client.query('DELETE FROM validTokens WHERE token = $1',[given]);
  query.on('end',function(){
    client.end();
  });
}


app.post('/login',function(request,response){

  query = client.query('SELECT Count(username) FROM users u WHERE u.username = $1 AND u.password = $2', [request.body.username, request.body.password]);

  query.on('row',function(result){
    if(result.count == 0){
      response.statusCode = 400;
      return response.send('No user with this username exists, or the password is incorrect!');
    }
    else{   //valid user
      var token = giveMeAToken();
      response.statusCode = 200;
      response.send(token);
    }
  });

  query.on('end',function(){
    client.end();
  });

});


app.post('/logout',function(request,response,removeActiveToken){

  if(!(tokenAllowed(request.body.token))){
    response.statusCode = 400;
    return response.send('Invalid Access token!');
  }

  response.statusCode = 200;
  return response.send(null)

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

