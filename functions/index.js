const express = require('express');
const app = express();
const serverless = require('serverless-http');
const capture = require('../launcher');  // Importez votre script Puppeteer

app.get('/', (req, res) => {
    res.send("say hello !!!");
});

app.get('/pup', async (req, res) => {
    try {
        await capture();
        res.send("Script Puppeteer exécuté avec succès !");
    } catch (erreur) {
        console.error('Erreur lors de l\'exécution du script Puppeteer :', erreur);
        res.status(500).send("Une erreur s'est produite lors de l'exécution du script Puppeteer.");
    }
});

app.listen(8000, () => {
    console.log("Connecté au port 8000");
});

module.exports.handler = serverless(app);