const puppeteer = require('puppeteer-core')
const chromium = require('@sparticuz/chromium')
const axios = require('axios')
const express = require('express')
const router = express.Router()
const b2 = require('./backblaze.upload');
const ba2 = require('./backblaze.crud')
const bucketName = 'screenshot-netlify';


const deleteFile = function (fname, fId) {
    ba2.authorize().then(() => {
        // Remplacez 'file_name_to_delete' par le nom du fichier que vous souhaitez supprimer
        const fileNameToDelete = fname;

        // Remplacez 'file_version_to_delete' par la version du fichier que vous souhaitez supprimer (obtenez-le à partir de la liste des versions)
        // const fileVersionToDelete = fvers;
        const fileIdToDelete = fId;

        // Supprimez le fichier
        ba2.deleteFileVersion({
            fileId: fileIdToDelete,
            fileName: fileNameToDelete,
            // bucketName,
        }).then(response => {
            console.log('Fichier supprimé avec succès:', response);
        }).catch(error => {
            console.error('Une erreur s\'est produite lors de la suppression du fichier:', error);
        })
    }).catch(error => {
        console.error('Erreur d\'autorisation B2:', error);
    });
}
router.get('/', (req, res) => {
    res.send("say hello !!!");
});
router.get('/pup/:name', async (req, res) => {
    const name = req.params.name;
    try {
        const browser = await puppeteer.launch({
            // executablePath: 'E:\\Slimjet\\slimjet.exe'
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