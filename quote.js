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
//comments
// sending res random, need proper write and end send back with proper status code
// random pre checks
//failure, send failure


app.get('/quote/all', function(req,res) {   
  tokenAllowed(req.query.token,function(ok){
    if(ok){
      doAll(req,res);
    }
    else{
      noToken(req,res);
    }
  });                              
});

app.get('/quote/random', function(req, res) {
    tokenAllowed(req.query.token,function(ok){
    if(ok){
      doRandom(req,res);
    }
    else{
      noToken(req,res);
    }
  });                              
});

app.get('/quote/:id', function(req, res) {
    tokenAllowed(req.query.token,function(ok){
    if(ok){
      doId(req,res);
    }
    else{
      noToken(req,res);
    }
  });                              
});

app.post('/quote', function(req, res) {
    tokenAllowed(req.body.token,function(ok){
    if(ok){
      doPost(req,res);
    }
    else{
      noToken(req,res);
    }
  });                              
});

app.post('/logout',function(req,res){
    tokenAllowed(req.body.token,function(ok){
    if(ok){
      doLogOut(req,res);
    }
    else{
      noToken(req,res);
    }
  });                              
});

// HAVE TO USE A GET (could do post also) REQUEST HERE ! BROWSER DOES NOT SUPPORT SENDING DATA FOR DELETE WITH THE REQUEST.
app.get('/quote/delete/:id', function(req, res) {
    tokenAllowed(req.query.token,function(ok){
    if(ok){
      doDelete(req,res);
    }
    else{
      noToken(req,res);
    }
  });                              
});

app.post('/login',function(req,res){

  var token = giveMeAToken();
  var query = client.query('SELECT COUNT(username) FROM users u WHERE u.username = $1 AND u.password = $2', [req.body.username, req.body.password]);


  var count;
  query.on('row',function(result){
    count = result.count;
  });

  query.on('end',function(){
    if(count != 0){
      var query2 = client.query('INSERT INTO validTokens(token) VALUES($1)', [token],function(){
        res.writeHead(200);
        res.write(token);
        res.end();
      });
    }
    else{
      res.write('unauthorized');
      res.end();
    }
  });

});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function giveMeAToken(given){
  var token = randtoken.generate(16);
  return token;
}

function tokenAllowed(given,callback){
  query = client.query('SELECT COUNT(token) FROM validTokens v WHERE v.token = $1',[given]);

  var count = 0;
  query.on('row',function(result){
    count = result.count;
  });

  query.on('end',function(){
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

function doLogOut(req,res){
  removeActiveToken(req.query.token,loggedOut(req,res));
}

function loggedOut(req,res){
  res.write("")
  res.end();
}

function doPost(req,res){
  //precheck - http header has enough information
  if(!req.body.hasOwnProperty('author') || !req.body.hasOwnProperty('text')) {
    res.writeHead(400);
    res.end();
  }

  var newQuote = {
    author : req.body.author,
    text : req.body.text
  };


  var newKey;
  query = client.query('SELECT tablekey FROM quotes q ORDER BY tablekey DESC LIMIT 1');

  query.on('row',function(row){
    newkey = row.tablekey + 1;
  });

  query.on('end',function(){

    query2 = client.query('INSERT INTO quotes(tablekey,author,content) VALUES($1,$2,$3)', [newkey, newQuote.author,newQuote.text]);

    query2.on('end',function(){
      res.writeHead(200);
      res.end();
    });

  });



}

function doAll(req,res){
  var results = [];
  query = client.query('SELECT * FROM quotes');

  query.on('row', function(row) {
    results.push(row);
  });

  query.on('end',function(){
    if(results.length == 0){
      res.writeHead(404);
      res.end();
    }
    else{
      res.writeHead(200);
      res.write(JSON.stringify(results.map(function (results){ return {author: results.author, content: results.content}; })));
      res.end();
    }
  });
}

function doId(req,res){
  var results = [];
  query = client.query('SELECT author, content FROM quotes q WHERE q.tablekey = $1', [req.query.id]);

  query.on('row', function(row) {
    results.push(row);
  });

  query.on('end',function(){
    if(results.length == 0){
      res.writeHead(404);
      res.end();
    }
    
    else{
      res.writeHead(200);
      res.write(JSON.stringify(results.map(function (results){ return {author: results.author, content: results.content}; })));
      res.end();
    }
  });
}

function doDelete(req,res){
  if(req.query.id < 1) {
    res.writeHead(400);
    res.end();
  }

    for(key in req.params){
    console.log('1: '+key);
  }
  for(key in req.params){
    console.log('1: '+req.params[key]);
  }
  for(key in req.body){
    console.log('2: '+key);
  }
  for(key in req.body){
    console.log('2: '+req.body[key]);
  }
  for(key in req.query){
    console.log('3a: '+key);
  }
  for(key in req.query){
    console.log('3b: '+req.query[key]);
  }
  console.log('3ddd: '+req.query[req.query.id]);
  console.log('gg: '+req.query.id);








  query = client.query('DELETE FROM quotes WHERE tablekey = $1', [req.query.id]);

  query.on('end',function(){
    res.writeHead(200);
    res.end();
  });
}

function doRandom(req,res){

  var max;

  query = client.query('SELECT tablekey FROM quotes q ORDER BY tablekey DESC LIMIT 1');

  query.on('row',function(row){
    max = row.tablekey;
  });

  query.on('end',function(){
    var key = Math.floor(Math.random() * (max + 1));
    var results = [];

    query2 = client.query('SELECT author, content FROM quotes q WHERE q.tablekey = $1', [key]);

    query2.on('row',function(row){
      results.push(row);
    });

    query2.on('end',function(){
      if(results.length == 0){
        res.writeHead(404);
        res.end();
      }
      else{
        res.writeHead(200);
        res.write('author: '+ results[0].author +', quote:' + results[0].content);
        res.end();
      }
    });
  });
}


// use PORT set as an environment variable
var server = app.listen(process.env.PORT, function() {
    console.log('Listening on port %d', server.address().port);
});