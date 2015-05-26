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

var quotes = [
  { author : 'Audrey Hepburn', text : "Nothing is impossible, the word itself says 'I'm possible'!"},
  { author : 'Walt Disney', text : "You may not realize it when it happens, but a kick in the teeth may be the best thing in the world for you"},
  { author : 'Unknown', text : "Even the greatest was once a beginner. Don’t be afraid to take that first step."},
  { author : 'Neale Donald Walsch', text : "You are afraid to die, and you’re afraid to live. What a way to exist."}
];



client = new pg.Client(connectionString);
client.connect();

// make sure we can parse JSON passed in the body or encoded into url
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

// serve up files from this directory 
app.use(express.static(__dirname));
// make sure we use CORS to avoid cross domain problems
app.use(cors());

app.get('/quote/all', function(req,res) {
  console.log("quote all called");
  res.send("quote all called");
});

app.get('/quote/random', function(req, res) {
  client.query('SELECT COUNT(author) AS length FROM quotes');
  query.on('row', function(result) {
    if(!result){
      return res.send('quotes table is empty');
    }else{
      length = result.length;
      var key = Math.floor(Math.random() * length);
      client.query('SELECT author, content FROM quotes q WHERE q.tablekey = $1', [key]);
      query.on('row', function(result) {
        if(!result){
          return res.send('cannot find random quote');
        }else{
          res.send('author: '+ result.author +', quote:' + result.content);
        }
      }); 
    }
  });
});


//app.get('/', function(req, res) {
//   var date = new Date();

//   client.query('INSERT INTO visits(date) VALUES($1)', [date]);

//   query = client.query('SELECT COUNT(date) AS count FROM visits WHERE date = $1', [date]);
//   query.on('row', function(result) {
//     console.log(result);

//     if (!result) {
//       return res.send('No data found');
//     } else {
//       res.send('Visits today: ' + result.count);
//     }
//   });
// });

// app.get('/signUp', function(request, response){
//   var username = "ryan";
//   var password = "b";

//   client.query('INSERT INTO users(username,password) VALUES($1,$2)', [username,password]);
//   response.send('Welcome, '+ username+'!');

// });



//Modify 
//GET /quote/random,
// GET /quote/:id, 
//POST /quote and 
//DELETE /quote/:id
//Add an extra RESTful method GET /quote/all that returns the contents of the quotes database.






app.get('/quote/:id', function(req, res) {
  if(quotes.length <= req.params.id || req.params.id < 0) {
    res.statusCode = 404;
    return res.send('Error 404: No quote found');
  }

  var q = quotes[req.params.id];
  res.send(q);
});

app.post('/quote', function(req, res) {
  console.log(req.body);
  if(!req.body.hasOwnProperty('author') || !req.body.hasOwnProperty('text')) {
    res.statusCode = 400;
    return res.send('Error 400: Post syntax incorrect.');
  }

  var newQuote = {
    author : req.body.author,
    text : req.body.text
  };

  quotes.push(newQuote);
  // should send back the location at this point
  console.log("Added!");
  newQuote.pos = quotes.length-1;
  res.send(newQuote);
});

app.delete('/quote/:id', function(req, res) {
  if(quotes.length <= req.params.id) {
    res.statusCode = 404;
    return res.send('Error 404: No quote found');
  }

  quotes.splice(req.params.id, 1);
  res.json(true);
});

// use PORT set as an environment variable
var server = app.listen(process.env.PORT, function() {
    console.log('Listening on port %d', server.address().port);
});

