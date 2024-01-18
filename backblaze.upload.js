

const B2 = require('easy-backblaze');

const applicationKeyId = '004afe371e745620000000001';
const applicationKey = 'K004PLz3QC+yCgHyEvn89TtIJL1GDAw';

const b2 = new B2(applicationKeyId, applicationKey);

module.exports = b2;
