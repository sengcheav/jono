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

app.get('/seqtok',function(req,res){
  tokenAllowed(req.query.token,function(ok){
    if(ok){
      doseqTok(req,res);
    }
    else{
      noToken(req,res);
    }
  });                              
});

app.get('/signup',function(req,res){
  console.log('1');
    console.log('1');
      console.log('1');
        console.log('1');
          console.log('1');
  res.sendFile('www/html/signup.html', {root: __dirname });
});

app.post('newUser',function(req,res){
  var un = req.body.username;
  var pw = req.body.password;
  var query = client.query('SELECT COUNT(username) FROM users u WHERE u.username = $1', [un]);

  var count;
  query.on('row',function(result){
    count = result.count;
  });

  query.on('end',function(){
    if(count == 0){
      var query2 = client.query('INSERT INTO users(username,password) VALUES($1,$2)',[un,pw],function(){
        res.sendFile('www/title.html', {root: __dirname });
      });
    }
    else{
      res.write('User with this Username already exists!');
      res.end();
    }
  });



});


app.get('/aTokenPlease',function(req,res){
    var token = giveMeAToken();
    var query2 = client.query('INSERT INTO validTokens(token) VALUES($1)', [token],function(){

    });
});


app.post('/login',function(req,res){
    console.log('12');
    console.log('12');
      console.log('12');
        console.log('12');
          console.log('12');
  var un = req.body.username;
  var pw = req.body.password;

  var query = client.query('SELECT COUNT(username) FROM users u WHERE u.username = $1 AND u.password = $2', [un,pw]);


  var count;
  query.on('row',function(result){
    count = result.count;
  });

  query.on('end',function(){
    if(count != 0){
      res.sendFile('www/html/title.html', {root: __dirname });
      // res.writeHead(200);
      // res.write(token);
      // res.end();
    }
    else{
    }

  });

});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function doseqTok(req,res){
  var token = giveMeAToken();

  var query = client.query('INSERT INTO validTokens(token) VALUES($1)', [token],function(){
        res.writeHead(200);
        res.write(token);
        res.end();
  });
  query.on('end',function(){
    removeActiveToken(req.query.token,function(){});
  });

  
}



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





// use PORT set as an environment variable
var server = app.listen(process.env.PORT, function() {
    console.log('Listening on port %d', server.address().port);
});