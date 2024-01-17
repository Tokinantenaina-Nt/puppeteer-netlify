const express = require('express');
const app = express();
const serverless = require('serverless-http');
const routes = require('../routes')
app.use('/', routes)
module.exports.handler = serverless(app);