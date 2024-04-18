require("dotenv").config();
//ici on require easy-backblaze
const B2 = require("easy-backblaze");

const applicationKeyId = process.env.applicationKeyId;
const applicationKey = process.env.applicationKey;

const b2 = new B2(applicationKeyId, applicationKey);

module.exports = b2;
