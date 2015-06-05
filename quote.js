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
var numberQuotes = 4;     
var path = require('path');                                                           
var randtoken = require('rand-token');



client = new pg.Client(connectionString);
client.connect();
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(express.static(__dirname +'/www'));
app.use(cors());



//get everything working
// sort behaviours, should it send error or just a message?
// add error checking, status codes, all the frills

// security
// go through assignment steps

//client gives approrpriate error/ console messages
//logical steps ie already logged on?





// First check the token is allowed, then perform one of the callbacks based on succces of this.
app.get('/quote/all', function(req,res) {   
  tokenAllowed(req.body.token,function(ok){
    if(ok){
      doAll(req,res);
    }
    else{
      noToken(req,res);
    }
  });                              
});


app.get('/quote/random', function(req, res) {
    tokenAllowed(req.body.token,noToken(req,res),doRandom(req,res));
});

app.get('/quote/:id', function(req, res) {
    tokenAllowed(req.body.token,noToken(req,res),doId(req,res));
});

app.post('/quote', function(req, res) {
    tokenAllowed(req.body.token,noToken(req,res),doPost(req,res));
}); 

app.post('/login',function(req,res){

  var token = giveMeAToken();
  var query = client.query('SELECT COUNT(username) FROM users u WHERE u.username = $1 AND u.password = $2', [req.body.username, req.body.password]);


  var count;
  query.on('row',function(result){
    count = result.count;
  });

  query.on('end',function(){
        console.log('logincount:' +count);
    if(count != 0){
      var query2 = client.query('INSERT INTO validTokens(token) VALUES($1)', [token],function(){
        res.send(token);
      });
    }
    else{
      res.writeHead(401);
      res.write('unauthorized!');
      res.end();
    }
  });

});

app.post('/logout',function(req,res){
  tokenAllowed(req.body.token,noToken(req,res),doLogOut(req,res));
});

app.delete('/quote/:id', function(req, res) {
  tokenAllowed(req.body.token,noToken(req,res),doDelete(req,res));
});
///////////////////////////////////






function giveMeAToken(given){
  var token = randtoken.generate(16);
  return token;
}

function tokenAllowed(given,callback){

  query = client.query('SELECT COUNT(token) FROM validTokens v WHERE v.token = $1',[given]);

  var count;
  query.on('row',function(result){
    count++;
  });

  query.on('end',function(){
    console.log('allcount:' +count);
    if(count != 0){
      callback(true);
    }
    else{
      callback(false);
    }
  });

}

function removeActiveToken(given,callback){
  query = client.query('DELETE FROM validTokens WHERE token = $1',[given]);
  callback();
}

function noToken(req,res){ 
  res.send('Invalid Access token!');
}

function doAll(req,res){
  var results = [];
  query = client.query('SELECT * FROM quotes');

  query.on('row', function(row) {
    results.push(row);
  });

  query.on('end',function(){
    res.writeHead(200);
    res.write(JSON.stringify(results.map(function (results){ return {author: results.author, content: results.content}; })));
    res.end();
  });


}

function doDelete(req,res){
    //precheck - provided id is valid
  if(req.params.id < 1) {
    res.send('Error 404: No quote found');
  }
  if(req.params.id > numberQuotes){
    res.send('Error 404: No quote found');
  }
          // query - remove quote from database using id provided by client in http header
  query = client.query('DELETE FROM quotes WHERE tablekey = $1', [req.params.id]);
    //locally update the number of quotes held in the database
  numberQuotes--;
    // inform the client of success
  res.send('quote removed!');
}


function doLogOut(req,res){
  removeActiveToken(req.body.token,loggedOut(req,res));
}

function loggedOut(req,res){
  res.send(null)
}

function doPost(req,res){
  //precheck - http header has enough information
  if(!req.body.hasOwnProperty('author') || !req.body.hasOwnProperty('text')) {
    res.send('Error 400: Post syntax incorrect.');
  }

  var newQuote = {
    author : req.body.author,
    text : req.body.text
  };
        // query - insert quote into database using info provided by client in http header
  query = client.query('INSERT INTO quotes(tablekey,author,content) VALUES($1,$2,$3)', [numberQuotes++, newQuote.author,newQuote.text]);

  // inform the client of success
  res.send('added quote!');
}


function doId(req,res){
  // query - select quote from database using a id variable provided in HTTP header
  query = client.query('SELECT author, content FROM quotes q WHERE q.tablekey = $1', [req.body.id]);
  query.on('row', function(result) {
    if(!result){
      res.send('cannot find quote with this id');
    }else{
      res.send('author: '+ result.author +', quote:' + result.content);
    }
  });
}

function doRandom(req,res){
  var key = Math.floor(Math.random() * numberQuotes);
    // query - select a random quote from database using a random number variable
  query = client.query('SELECT author, content FROM quotes q WHERE q.tablekey = $1', [key]);
  query.on('row', function(result) {
    if(!result){
      res.send('cannot find random quote');
    }else{
          // when result has been returned, return them to the client
    res.send('author: '+ result.author +', quote:' + result.content);
    }
  });//

}


// use PORT set as an environment variable
var server = app.listen(process.env.PORT, function() {
    console.log('Listening on port %d', server.address().port);
});