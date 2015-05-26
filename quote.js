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




client = new pg.Client(connectionString);
client.connect();

// make sure we can parse JSON passed in the body or encoded into url
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

// serve up files from this directory 
app.use(express.static(__dirname));
// make sure we use CORS to avoid cross domain problems
app.use(cors());

app.get('/',function(req,res){
  res.render('index.html');
});

app.get('/quote/all', function(req,res) {
  console.log("quote all called");
  res.send("quote all called");
});


app.get('/quote/random', function(req, res) {
  var key = Math.floor(Math.random() * numberQuotes);
  query = client.query('SELECT author, content FROM quotes q WHERE q.tablekey = $1', [key]);
  query.on('row', function(result) {
    if(!result){
      return res.send('cannot find random quote');
    }else{
    res.send('author: '+ result.author +', quote:' + result.content);
  });
});





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

