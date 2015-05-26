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
query = client.query('CREATE TABLE users(userid serial, username text PRIMARY KEY, password text NOT NULL, loggedIn boolean, accessToken INTEGER)');
query = client.query('INSERT INTO users(username,password,loggedin) VALUES($1,$2)', [users[0].username,users[0].password,false,-1]);
query = client.query('INSERT INTO users(username,password,loggedin) VALUES($1,$2)', [users[1].username,users[1].password,false,-1]);
query = client.query('INSERT INTO users(username,password,loggedin) VALUES($1,$2)', [users[2].username,users[2].password,false,-1]);
query = client.query('INSERT INTO users(username,password,loggedin) VALUES($1,$2)', [users[3].username,users[3].password,false,-1]);


//CALLBACK TO END DATABASE CONNECTION
query.on('end', function(result) { client.end(); });