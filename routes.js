const puppeteer = require('puppeteer-core')
//const chromium = require('@sparticuz/chromium')
const axios = require('axios')
const express = require('express')
const router = express.Router()
const b2 = require('./backblaze.upload');
const ba2 = require('./backblaze.crud')
const bucketName = 'screenshot-netlify';



router.get('/', (req, res) => {
    res.send("say hello !!!");
});
router.get('/pup/:name/:click?', async (req, res) => {
    const name = req.params.name;
    const click = req.params.click
    try {
        const browser = await puppeteer.launch({
            executablePath: 'E:\\Slimjet\\slimjet.exe'
            // args: chromium.args,
            // defaultViewport: chromium.defaultViewport,
            // executablePath: await chromium.executablePath(),
            // headless: chromium.headless,
            // ignoreHTTPSErrors: true,
        });
        const page = await browser.newPage();
        await page.goto('https://www.flashscore.mobi/?s=2');
        await page.waitForSelector('#score-data');
        const linksArray = await page.evaluate(() => {
            const liveLinks = document.querySelectorAll('#score-data a.live');

            const linksArray = [];

            liveLinks.forEach((link, index) => {
                const existingText = link.textContent.trim();
                link.textContent = existingText + ' click ' + (index + 1);
                linksArray.push(link.href);
            });

            return linksArray;
        });
        if (click) {
            console.log('click  = = = = =   ', click);

            const handleConsoleMessage = async (linkHandle) => {
                if (linkHandle) {
                    const index = parseInt(linkHandle.replace('click', '')) - 1;
                    if (index >= 0 && index < linksArray.length) {
                        console.log(`Executing command: ${linkHandle}`);
                        await page.goto(linksArray[index]);
                    } else {
                        console.log('Index invalide.');
                    }
                }
            };
            handleConsoleMessage(click)
        }
        await page.waitForTimeout(3000);
        const screenshot = await page.screenshot();


        await ba2.authorize();
        const fileName = `screenshot-${name}.png`;
        const bucketId = '7aff3eb387911e8784d50612'
        // Recherche du fichier avec un nom exact dans le bucket
        const fileNamesResponse = await ba2.listFileNames({ bucketName, prefix: fileName, bucketId });
        async function uploadFile() {
            await b2.uploadFile(screenshot, {
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
        }
        if (fileNamesResponse.data.files.length === 0) {
            console.log('Le fichier exact n\'a pas été trouvé.');
            uploadFile()
        } else {
            const fileId = fileNamesResponse.data.files[0].fileId;
            await ba2.deleteFileVersion({ fileId, prefix: fileName, fileName, bucketId });
            console.log(`Suppression de la version ${fileId}`);
            uploadFile()
        }
        await browser.close();

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