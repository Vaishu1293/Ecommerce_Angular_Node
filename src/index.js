const express = require('express');
const path = require('path');
const debug = require("debug")("node-angular");
const http = require("http");
const bodyParser = require("body-parser");

// DB config files
require('./db/mongoose');

// Routers
const userRouter = require('./routers/user');
const productRouter = require('./routers/product');

// Config
const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  //res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/api/user', userRouter);
app.use('/api/product', productRouter);

app.get('', (req, res) => {
  res.json({
    msg: 'Welcome'
  });
});

const server = http.createServer(app);

// Setup server
server.listen(port, () => {
  console.log('Server is up on port ' + port);
});
