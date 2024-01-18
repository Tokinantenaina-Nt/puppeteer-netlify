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
    const name = req.params.name
    try {
        const browser = await puppeteer.launch(
            //   { executablePath: 'E:\\Slimjet\\slimjet.exe' }
            {
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
            }
        );
        const page = await browser.newPage();
        await page.goto('https://www.flashscore.mobi/?s=2');

        const screenshot = await page.screenshot();

        await browser.close();
        await b2.uploadFile(screenshot, {
            name: `screenshot-${name}.png`, // Nom du fichier sur Backblaze B2
            bucket: 'screenshot-netlify',
        },
            function (err, response) {
                if (err) {
                    console.error('Une erreur s\'est produite :', err);
                    res.status(500).send('Erreur interne du serveur ###', err);
                } else {
                    res.status(200).json({ message: 'Done!', response });
                }
            }
        );


    } catch (error) {
        console.error('Une erreur s\'est produite :', error);
        res.status(500).send('Erreur interne du serveur ::: ', error);
    }
});

router.get('/getImageURL', (req, res) => {

    try {
        const imageUrl = 'https://f004.backblazeb2.com/file/screenshot-netlify/screenshot-1.png';
        res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Une erreur s\'est produite lors de la récupération de l\'URL de l\'image :', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
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