const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const axios = require("axios"); // football.tomorrow.odds
const express = require("express");
const router = express.Router();
const b2 = require("./backblaze.upload");
const ba2 = require("./backblaze.crud");
const bucketName = "screenshot-netlify";
const userData = require("./usersArray.js");
const usersArray = userData.usersArray;

let url_target,
  mess_ok = "Capture d'écran uploadée avec succès!";

router.get("/", (req, res) => {
  res.send("say hello !!!");
});
/*, '/football_live/:name', '/football_today/:name/:click?', '/football_yesterday/:name/:click?', '/football_tomorrow/:name/:click?', '/football_today_finished/:name/:click?']*/
// const A = 'https://www.flashscore.mobi/?s=2'; // football.LIVE + click
// const B = 'https://www.flashscore.mobi/?d=0&s=5'; // football.today.odds
// const C = 'https://www.flashscore.mobi/?d=-1&s=5'; // football.yesterday.odds + click
// const D = 'https://www.flashscore.mobi/?d=0&s=3'; // football.today.finished + click
// const E = 'https://www.flashscore.mobi/?d=1&s=5'; // football.tomorrow.odds
router.get(
  [
    "/pup/:name/:click?",
    "/:id/football_today_finished/:name/:click?",
    "/football_live/:name",
    "/:id/football_today/:name",
    "/:id/football_tomorrow/:name",
    "/:id/football_yesterday/:name/:click?"
  ],
  async (req, res) => {
    const { name, click, id } = req.params;
    console.log(usersArray);
    console.log(id);
    // Convertir id en entier
    const idAsInt = parseInt(id, 10);

    if (!isNaN(idAsInt) && usersArray.includes(idAsInt)) {
      if (
        req.path === `/${id}/football_today_finished/${name}/${click || ""}`
      ) {
        console.log("Chemin correspondant, mise à jour de url_target");
        url_target = "https://www.flashscore.mobi/?s=3";
      }
      if (req.path === `/${id}/football_yesterday/${name}/${click || ""}`) {
        console.log("Chemin correspondant, mise à jour de url_target");
        url_target = "https://www.flashscore.mobi/?s=3";
      }
      if (req.path === `/${id}/football_live/${name}/${click || ""}`) {
        console.log("Chemin correspondant, mise à jour de url_target");
        url_target = "https://www.flashscore.mobi/?s=3";
      }
      if (req.path === `/${id}/football_today/${name}`) {
        console.log("Chemin correspondant, mise à jour de url_target");
        url_target = "https://www.flashscore.mobi/?s=3";
      }
      if (req.path === `/${id}/football_tomorrow/${name}`) {
        console.log("Chemin correspondant, mise à jour de url_target");
        url_target = "https://www.flashscore.mobi/?s=3";
      }
    } else {
      console.log("Utilisateur NON auth");
      url_target = "https://www.flashscore.mobi/?s=2";
      mess_ok = "inscription pour voir plus de details des matchs";
    }

    console.log("url_target:", url_target);
    try {
      const browser = await puppeteer.launch({
        // executablePath: "E:\\Slimjet_fonctionnel_win8\\slimjet.exe"
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true
      });
      const page = await browser.newPage();

      await page.goto(url_target);
      await page.waitForSelector("#score-data");

      let myLinksArray;

      async function live(params) {
        const linksArray = await page.evaluate(params => {
          const liveLinks = document.querySelectorAll(
            `#score-data a.${params}`
          );
          const linksArray = [];

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
            if (!userArray.includes(idAsInt)) {
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
              res
                .status(500)
                .send("Erreur interne du serveur : " + err.message);
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
      await page.waitForTimeout(7000);
      await browser.close();
    }
  }
);

router.get("/getImageURL/:name", (req, res) => {
  const name = req.params.name;
  try {
    const imageUrl = `https://f004.backblazeb2.com/file/screenshot-netlify/screenshot-${name}.png`;
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error(
      "Une erreur s'est produite lors de la récupération de l'URL de l'image :",
      error
    );
    res.status(500).json({ error: "Erreur interne du serveur ###", error });
  }
});
router.get("/filelist", async (req, res) => {
  let response;
  try {
    await ba2.authorize();
    response = await ba2.listFileNames({
      bucketId: "7aff3eb387911e8784d50612",
      maxFileCount: 100,
      delimiter: "",
      prefix: ""
    });
    res.status(200).json(response.data);
    console.log(response.data);
  } catch (error) {
    console.error("Une erreur s'est produite :", error);
    res.status(500).send("Erreur interne du serveur");
  }
});

module.exports = router;
