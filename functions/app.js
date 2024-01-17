const express = require('express');
const app = express();
const serverless = require('serverless-http');
const routes = require('../routes')
app.use(cors({
    origin: '*'
}));
app.use('/.netlify/functions/app', routes)
module.exports.handler = serverless(app);