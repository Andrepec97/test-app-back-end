const express = require("express");
const serverless = require("serverless-http");

const app = express();
const router = express.Router();

app.use(express.json());
const users = []


app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);
