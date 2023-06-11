const express = require("express");
const path = require("path");
const debug = require("debug")("node-angular");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");

// DB config files
require("./db/mongoose");

// Routers
const userRouter = require("./routers/user");
const productRouter = require("./routers/product");
const orderRouter = require("./routers/order");

// Config
const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader('Access-Control-Allow-Origin', 'https://food-vending-frontend.web.app/');
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
var corsOptions = {
  origin: ['http://localhost:4200', 'https://food-vending-frontend.web.app'],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/order", orderRouter);

app.get("", (req, res) => {
  res.json({
    msg: "Welcome",
  });
});

const server = http.createServer(app);

// Setup server
server.listen(port, () => {
  console.log("Server is up on port " + port);
});
