const Router = require("express").Router;
const { tokenGenerator, voiceResponse } = require("./handler");

const router = new Router();

router.get("/token", (req, res) => {
  const callerId = req.query.callerId;
    console.log(callerId);
  res.send(tokenGenerator(callerId));
});
router.post("/voice", (req, res) => {
  res.set("Content-Type", "text/xml");
  res.send(voiceResponse(req.body));
});

module.exports = router;
