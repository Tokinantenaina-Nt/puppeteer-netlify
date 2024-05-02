const express = require("express");
const app = express();
const routes = require("./routes");
app.use("/", routes);
app.listen(8000, () => {
  console.log("Connecté au port 8000");
});
