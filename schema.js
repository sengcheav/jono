var pg = require('pg').native
  , connectionString = process.env.DATABASE_URL
  , client
  , query;

client = new pg.Client(connectionString);
client.connect();
query = client.query('CREATE TABLE quotes(tablekey serial, author text PRIMARY KEY, content text NOT NULL)');
query.on('end', function(result) { client.end(); });


