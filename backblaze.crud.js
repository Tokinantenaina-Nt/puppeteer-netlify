require("dotenv").config();
//ici on utilise backblaze-b2
const applicationKeyId = process.env.applicationKeyId;
const applicationKey = process.env.applicationKey;

const Ba2 = require("backblaze-b2");
const ba2 = new Ba2({
  applicationKeyId: applicationKeyId,
  applicationKey: applicationKey
});

module.exports = ba2;
