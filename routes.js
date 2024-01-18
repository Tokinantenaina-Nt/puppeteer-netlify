const puppeteer = require('puppeteer-core')
//const chromium = require('@sparticuz/chromium')
const express = require('express')
const router = express.Router()
const b2 = require('./backblaze.upload');
const ba2 = require('./backblaze.crud')



router.get('/', (req, res) => {
    res.send("say hello !!!");
});

router.get('/pup/:name', async (req, res) => {
    const name = req.params.name;
    try {
        const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });
        const page = await browser.newPage();
        await page.goto('https://www.flashscore.mobi/?s=2');

        const screenshot = await page.screenshot();

        await browser.close();
        b2.uploadFile(screenshot, {
            name: `screenshot-${name}.png`,
            bucket: 'screenshot-netlify',
        }, (err, response) => {
            if (err) {
                console.error('Une erreur s\'est produite lors de l\'upload sur Backblaze B2 :', err);
                res.status(500).send('Erreur interne du serveur : ' + err.message);
            } else {
                console.log('Upload réussi sur Backblaze B2 :', response);
                res.status(200).json({ message: 'Capture d\'écran uploadée avec succès!', response });
            }
        });
    } catch (error) {
        console.error('Une erreur s\'est produite lors de la capture d\'écran :', error);
        res.status(500).send('Erreur interne du serveur : ' + error.message);
    }
});


router.get('/getImageURL/:name', (req, res) => {
    const name = req.params.name
    try {
        const imageUrl = `https://f004.backblazeb2.com/file/screenshot-netlify/screenshot-${name}.png`;
        res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Une erreur s\'est produite lors de la récupération de l\'URL de l\'image :', error);
        res.status(500).json({ error: 'Erreur interne du serveur ###', error });
    }

});
router.get('/filelist', async (req, res) => {

    let response;
    try {
        await ba2.authorize();
        response = await ba2.listFileNames({
            bucketId: '7aff3eb387911e8784d50612',
            maxFileCount: 100,
            delimiter: '',
            prefix: '',
        });
        res.status(200).json(response.data);
        console.log(response.data);
    } catch (error) {
        console.error('Une erreur s\'est produite :', error);
        res.status(500).send('Erreur interne du serveur');
    }



})


module.exports = router