var pg = require('pg').native
  , connectionString = process.env.DATABASE_URL
  , client
  , query;


var users = [
  { username : 'griffinRyan', password : "dirtyCat01"},
  { username : 'collinsBen', password : "niceBear02"},
  { username : 'couttsCameron', password : "swampDonkey03"},
  { username : 'soloiNathan', password : "greasyHobo04"},
];



 //CREATE DATABASE CONECTION
client = new pg.Client(connectionString);
client.connect();

//CREATE A SCHEMA - users
query = client.query('CREATE TABLE users(username text PRIMARY KEY, password text NOT NULL)');
query = client.query('INSERT INTO users(username,password) VALUES($1,$2)', [users[0].username,users[0].password]);
query = client.query('INSERT INTO users(username,password) VALUES($1,$2)', [users[1].username,users[1].password]);
query = client.query('INSERT INTO users(username,password) VALUES($1,$2)', [users[2].username,users[2].password]);
query = client.query('INSERT INTO users(username,password) VALUES($1,$2)', [users[3].username,users[3].password]);


//CALLBACK TO END DATABASE CONNECTION
query.on('end', function(result) { client.end(); });