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
        }, await function (err, response) {
            res.status(200).json({ message: 'Done!', err, response });
        });


    } catch (error) {
        console.error('Une erreur s\'est produite :', error);
        res.status(500).send('Erreur interne du serveur ::: ', error);
    }
});

router.get('/getImageURL', (req, res) => {
    try {
        // URL à renvoyer
        const imageUrl = 'https://f004.backblazeb2.com/file/screenshot-netlify/screenshot-1.png';

        // Renvoyer l'URL en tant que réponse JSON
        res.json({ imageUrl });
    } catch (error) {
        console.error('Une erreur s\'est produite lors de la récupération de l\'URL de l\'image :', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});
router.get('/filelist', async (req, res) => {
    await ba2.authorize();
    let response = await ba2.listFileNames({
        bucketId: '7aff3eb387911e8784d50612',
        // startFileName: 'startFileName',
        maxFileCount: 100,
        delimiter: '',
        prefix: ''
    });
    res.json(response.data);
    console.log(response.data);


})


module.exports = router