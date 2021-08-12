const express = require("express");
const { saveFiles, getFiles, getFile, updateFile, deleteFile } = require("../db/files.js");

const router = express.Router();

router.post("/:userId", async (req, res) => {
  if (!req.session.user || Number(req.params.userId) !== req.session.user.id) {
    return res.sendStatus(401);
  }
  try {
    await saveFiles(req.body, req.session.user.id);
    res.sendStatus(204);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.get("/:userId", async (req, res) => {
  if (!req.session.user || Number(req.params.userId) !== req.session.user.id) {
    return res.sendStatus(401);
  }
  try {
    if (req.query.hash) {
      const file = await getFile(req.params.userId, { hash: req.query.hash });

      if (file) {
        return res.json(file);
      }
      res.sendStatus(404);
    }
    else {
      const files = await getFiles(req.params.userId);

      res.json({ files });
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.get("/:userId/:fileId", async (req, res) => {
  if (!req.session.user || Number(req.params.userId) !== req.session.user.id) {
    return res.sendStatus(401);
  }
  try {
    const file = await getFile(req.params.userId, { id: req.params.fileId });

    if (file) {
      return res.json(file);
    }
    res.sendStatus(404);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.patch("/:userId/:fileId", async (req, res) => {
  if (!req.session.user || Number(req.params.userId) !== req.session.user.id) {
    return res.sendStatus(401);
  }
  try {
    const success = await updateFile(req.body, req.params.userId, req.params.fileId);

    if (success) {
      return res.sendStatus(204);
    }
    res.sendStatus(500);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.delete("/:userId/:fileId", async (req, res) => {
  if (!req.session.user || Number(req.params.userId) !== req.session.user.id) {
    return res.sendStatus(401);
  }
  try {
    const success = await deleteFile(req.params.userId, req.params.fileId);

    if (success) {
      return res.sendStatus(204);
    }
    res.sendStatus(500);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

module.exports = router;
