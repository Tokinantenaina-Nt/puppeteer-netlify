const Ba2 = require('backblaze-b2');
const applicationKeyId = '004afe371e745620000000001';
const applicationKey = 'K004PLz3QC+yCgHyEvn89TtIJL1GDAw';
const ba2 = new Ba2({
    applicationKeyId: applicationKeyId, // or accountId: 'accountId'
    applicationKey: applicationKey // or masterApplicationKey
});

async function GetBucket() {
    try {
        await ba2.authorize(); // must authorize first (authorization lasts 24 hrs)
        let response = await ba2.getBucket({ bucketName: 'screenshot-netlify' });
        console.log(response.data);

    } catch (err) {
        console.log('Error getting bucket:', err);
    }

}



module.exports = ba2 