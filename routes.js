const puppeteer = require('puppeteer-core');
const express = require('express')
const router = express.Router()
router.get('/', (req, res) => {
    res.send("say hello !!!");
});
router.get('/pup', async (req, res) => {
    try {
        const browser = await puppeteer.launch(
            { executablePath: 'E:\\Slimjet\\slimjet.exe' }
        );
        const page = await browser.newPage();
        await page.goto('https://www.flashscore.mobi/?s=2');

        // Récupérer le titre de la page
        const title = await page.title();

        // Fermer le navigateur
        await browser.close();

        // Envoyer le titre en réponse
        res.send(`Le titre de la page est : ${title}`);
    } catch (error) {
        console.error('Une erreur s\'est produite :', error);
        res.status(500).send('Erreur interne du serveur');
    }
});
module.exports = router