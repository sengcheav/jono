var pg = require('pg').native
  , connectionString = process.env.DATABASE_URL
  , client
  , query;


 //CREATE DATABASE CONECTION
client = new pg.Client(connectionString);
client.connect();

var un = 'test';
var pw = '1234';

//CREATE A SCHEMA - users
//query = client.query('CREATE TABLE users(username text PRIMARY KEY, password text NOT NULL)');
var query2 = client.query('INSERT INTO users(username,password) VALUES($1,$2)',[un,pw]);

//CALLBACK TO END DATABASE CONNECTION
query.on('end', function(result) { client.end(); });