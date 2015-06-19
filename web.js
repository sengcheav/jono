var express = require('express')
  , pg = require('pg').native
  , connectionString = process.env.DATABASE_URL
  , start = new Date()
  , port = process.env.PORT
  , client;


var bodyParser = require('body-parser');


var app=express();

var path = require('path');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/www'));


client = new pg.Client(connectionString);
client.connect();

// app.get('/', function(req, res) {
//   res.sendFile('login.html');
// });

app.post('/signUp', function(request, response){
  //hash and salt before addition to database
  //TODO read lecture notes abotu security
  //client.query('INSERT INTO users(username,password) VALUES($1,$2)', [username,password]);
});


app.get('/',function(req,res){
  res.sendFile(path.join(__dirname, '/www', 'html/index.html'));
});


app.post('/login',function(req,res){    //recieves login form back

    //Perform login checks
  if(!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password')) {
    res.statusCode = 400;
    return res.send('Error 400: Username or Password missing');
  }
  var username = req.body.username;
  var password = req.body.password;

  query = client.query('SELECT Count(username) FROM users u WHERE u.username = $1 AND u.password = $2',[username,password],function(error,response){
    if (error){
      res.statusCode = 500;
      return res.send('ERROR: '+ error.message);
    }
  });

  query.on('row',function(result){
    if(result.count == 0){      // user does not exist or username/password incorrect
       res.sendFile(path.join(__dirname, '/www', 'index.html'));      //if not redirect to login page //TODO with additional information?
    }
    else{
      query2 = client.query('UPDATE users SET loggedin = true WHERE username = $1',[username],function(error,response){
        if (error){
          res.statusCode = 500;
          return res.send('ERROR: '+ error.message);
        }
          res.sendFile(path.join(__dirname, '/www', 'html/title.html'));  //redirects to index.html if successful
      });
    }
  }); 
});


// use PORT set as an environment variable
var server = app.listen(process.env.PORT, function() {
    console.log('Listening on port %d', server.address().port);
});