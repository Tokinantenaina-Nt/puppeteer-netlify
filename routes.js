const express = require("express");
const router = express.Router();
const { handleRequest } = require("./request/handleRequest");
const ba2 = require("./backblaze.crud");
require("dotenv").config();
router.get("/", (req, res) => {
  res.send("say hello !!!");
});

router.get(
  [
    "/pup/:name/:click?", // acceuil
    "/:id/football_today_finished/:name/:click?", // finished
    "/football_live/:name", // live
    "/:id/football_today/:name", // match
    "/:id/football_tomorrow/:name", // demain
    "/:id/football_yesterday/:name/:click?" // resultat
  ],
  (req, res) => {
    handleRequest(req, res);
  }
);
//fonction pour regarder un image
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

//lister mes fichiers chez backblaze
const urlList = process.env.urlList;
const bucketId = process.env.bucketId;
router.get(`${urlList}`, async (req, res) => {
  let response;
  try {
    await ba2.authorize();
    response = await ba2.listFileNames({
      bucketId: `${bucketId}`,
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
