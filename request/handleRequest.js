const b2 = require("../backblaze.upload");
const ba2 = require("../backblaze.crud");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const bucketName = "screenshot-netlify";
const userData = require("../usersArray.js");
const usersArray = userData.usersArray;
let url_target,
  mess_ok = "Capture d'écran uploadée avec succès!";

module.exports.handleRequest = async (req, res) => {
  const { name, click, id } = req.params;
  console.log(id);
  const idAsInt = parseInt(id, 10);

  if (!isNaN(idAsInt) && usersArray.includes(idAsInt)) {
    if (req.path === `/${id}/football_today_finished/${name}/${click || ""}`) {
      url_target = "https://www.flashscore.mobi/?s=3";
    }
    if (req.path === `/${id}/football_yesterday/${name}/${click || ""}`) {
      url_target = "https://www.flashscore.mobi/?s=3";
    }
    if (req.path === `/${id}/football_live/${name}/${click || ""}`) {
      url_target = "https://www.flashscore.mobi/?s=3";
    }
    if (req.path === `/${id}/football_today/${name}`) {
      url_target = "https://www.flashscore.mobi/?s=3";
    }
    if (req.path === `/${id}/football_tomorrow/${name}`) {
      url_target = "https://www.flashscore.mobi/?s=3";
    }
  } else {
    console.log("Utilisateur NON auth");
    url_target = "https://www.flashscore.mobi/?s=2";
    mess_ok = "inscription pour voir plus de details des matchs";
  }
  //lance puppeteer
  try {
    const browser = await puppeteer.launch({
      // executablePath: "E:\\Slimjet_fonctionnel_windows7\\slimjet.exe", //commenter ceci en mode netlify
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true
      // headless: false //commenter ceci en mode netlify
    });
    const page = await browser.newPage();
    await page.goto(url_target);
    await page.waitForSelector("#score-data");

    //Scrapping
    let myLinksArray;
    async function live(params) {
      const linksArray = await page.evaluate(params => {
        const linksArray = []; //stockage de tous les liens utiles
        const liveLinks = document.querySelectorAll(`#score-data a.${params}`);
        liveLinks.forEach((link, index) => {
          const existingText = link.textContent.trim();
          link.textContent = existingText + " click " + (index + 1);
          linksArray.push(link.href);
        });
        return linksArray;
      }, params);

      myLinksArray = linksArray; // Stockage dans la variable globale
      return linksArray;
    }

    const handleConsoleMessage = async linkHandle => {
      if (linkHandle) {
        const index = parseInt(linkHandle.replace("click", "")) - 1;
        if (index >= 0 && index < myLinksArray.length) {
          console.log(`Executing command: ${linkHandle}`);
          await page.goto(myLinksArray[index]);
        } else {
          if (!usersArray.includes(idAsInt)) {
            mess_ok = "utilisateur non identifié";
            console.log("utilisateur non identifié");
          } else {
            mess_ok = "Index invalide.";
            console.log("Index invalide.");
          }
        }
      }
    };

    (async () => {
      if (url_target === "https://www.flashscore.mobi/?s=2") {
        await live("live");
      } else {
        await live("fin");
      }
      if (click) {
        console.log("click  = = = = =   ", click);
        handleConsoleMessage(click);
      }
    })();

    await page.waitForTimeout(3000);
    const screenshot = await page.screenshot();

    //upload vers backblaze
    await ba2.authorize();
    const fileName = `screenshot-${name}.png`;
    const bucketId = "7aff3eb387911e8784d50612";

    const fileNamesResponse = await ba2.listFileNames({
      bucketName,
      prefix: fileName,
      bucketId
    });
    async function uploadFile(mess) {
      await b2.uploadFile(
        screenshot,
        {
          name: `screenshot-${name}.png`,
          bucket: "screenshot-netlify"
        },
        (err, response) => {
          if (err) {
            console.error(
              "Une erreur s'est produite lors de l'upload sur Backblaze B2 :",
              err
            );
            res.status(500).send("Erreur interne du serveur : " + err.message);
          } else {
            console.log("Upload réussi sur Backblaze B2 :", response);
            res.status(200).json({ message: mess, response });
          }
        }
      );
    }
    if (fileNamesResponse.data.files.length === 0) {
      console.log("L'ancien fichier n'a pas été trouvé.");
      uploadFile(mess_ok);
    } else {
      const fileId = fileNamesResponse.data.files[0].fileId;
      await ba2.deleteFileVersion({
        fileId,
        prefix: fileName,
        fileName,
        bucketId
      });
      console.log(`Suppression de la version ${fileId}`);
      uploadFile(mess_ok);
    }
    await browser.close();
  } catch (error) {
    console.error(
      "Une erreur s'est produite lors de la capture d'écran :",
      error
    );
    res.status(500).send("Erreur interne du serveur : " + error.message);
    //await page.waitForTimeout(7000);
    await browser.close();
  }
};
