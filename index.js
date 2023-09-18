const https = require("https");
const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const router = require("./src/router");
require("dotenv").config();
const tokenGenerator = require('./src/handler');

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

app.use(router);

// Load SSL/TLS certificates
const privateKey = fs.readFileSync("./key.pem", "utf8");
const certificate = fs.readFileSync("./cert.pem", "utf8");

const credentials = {
  key: privateKey,
  cert: certificate,
};

const httpsServer = https.createServer(credentials, app);
const port = process.env.PORT || 3000;

httpsServer.listen(port, function () {
  console.log("Express server running on *:" + port + " (HTTPS)");
});
