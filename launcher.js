const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send("say hello !!!");
});

router.get('/pup', async (req, res) => {
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

        // Capture d'écran de la page
        const screenshot = await page.screenshot();

        // Fermer le navigateur
        await browser.close();

        // Envoyer la capture d'écran en réponse
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': screenshot.length,
        });
        res.end(screenshot, 'binary');
    } catch (error) {
        console.error('Une erreur s\'est produite :', error);
        res.status(500).send('Erreur interne du serveur');
    }
});

module.exports = router;

