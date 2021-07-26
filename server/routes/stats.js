const express = require("express");
const { updateStats, fetchStats, resetStats } = require("../db/stats.js");

const router = express.Router();

router.patch("/", async (req, res) => {
  if (!req.session.user) {
    return res.sendStatus(401);
  }
  try {
    await updateStats(req.session.user.id, req.body);
    res.sendStatus(204);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.get("/me", async ({ session: { user }}, res) => {
  if (user) {
    try {
      const stats = await fetchStats(user.id) || { data: {} };

      res.json(stats);
    } catch (e) {
      console.log(e);
      res.sendStatus(500);
    }
  }
  else {
    res.sendStatus(204);
  }
});

router.delete("/", async (req, res) => {
  if (!req.session.user) {
    return res.sendStatus(401);
  }
  try {
    await resetStats(req.session.user.id);
    res.sendStatus(204);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

module.exports = router;
