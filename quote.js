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
  var results = [];

  query = client.query('SELECT * FROM quotes');

  query.on('row', function(row) {
    results.push(row);
  });

  query.on('end', function() {
    return res.send(JSON.stringify(results, null, 3)); client.end();

  });

});

app.get('/quote/random', function(req, res) {
  var key = Math.floor(Math.random() * numberQuotes);
  query = client.query('SELECT author, content FROM quotes q WHERE q.tablekey = $1', [key]);
  query.on('row', function(result) {
  res.send('author: '+ result.author +', quote:' + result.content);
  });
});


app.get('/quote/:id', function(req, res) {
  if(req.params.id < 1) {
    res.statusCode = 404;
    return res.send('Error 404: No quote found, please note quotes index starts from ONE(1)');
  }
  if(req.params.id > numberQuotes){
    res.statusCode = 404;
    return res.send('Error 404: No quote found, please note quotes index starts from ONE(1)');
  }

  query = client.query('SELECT author, content FROM quotes q WHERE q.tablekey = $1', [req.params.id]);
  query.on('row', function(result) {
    res.send('author: '+ result.author +', quote:' + result.content);
  });
  query.on('end', function() {
    client.end();
  });
});



app.post('/quote', function(req, res) {
  if(!req.body.hasOwnProperty('author') || !req.body.hasOwnProperty('text')) {
    res.statusCode = 400;
    return res.send('Error 400: Post syntax incorrect.');
  }

  var newQuote = {
    author : req.body.author,
    text : req.body.text
  };
  query = client.query('INSERT INTO quotes(author,content) VALUES($1,$2)', [newQuote.author,newQuote.text]);
  numberQuotes++;
  res.send('added quote!');
  query.on('end', function() {
    client.end();
  });
});






///////////////////////////////////
app.delete('/quote/:id', function(req, res) {
  if(req.params.id < 1) {
    res.statusCode = 404;
    return res.send('No quote found');
  }
  if(req.params.id > numberQuotes){
    res.statusCode = 404;
    return res.send('No quote found');
  }
  query = client.query('DELETE FROM quotes WHERE tablekey = $1', [req.params.id]);
  numberQuotes--;
  res.send('quote removed!');
    query.on('end', function() {
        client.end();
  });
});
///////////////////////////////////





// use PORT set as an environment variable
var server = app.listen(process.env.PORT, function() {
    console.log('Listening on port %d', server.address().port);
});

