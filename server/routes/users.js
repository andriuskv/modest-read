const express = require("express");
const validator = require("validator");
const { createUser, loginUser } = require("../db/users.js");
const { loginAttemptLimiter } = require("../middleware/rateLimiter.js");

const router = express.Router();

router.post("/", async (req, res) => {
  const fieldsValid = validateFields(["email", "password", "repeatedPassword"], req.body);

  if (!fieldsValid) {
    return res.sendStatus(400);
  }

  if (!validator.isEmail(req.body.email)) {
    return res.status(400).json({ message: "Invalid email.", field: "email" });
  }

  if (!validator.isLength(req.body.password, { min: 6, max: 254 })) {
    return res.status(400).json({ message: "Password must be at least 6 characters.", field: "password" });
  }

  if (req.body.password !== req.body.repeatedPassword) {
    return res.status(400).json({ message: "Passwords don't match.", field: "password" });
  }

  try {
    const user = await createUser(req.body);

    if (user) {
      req.session.user = user;
      return res.json(user);
    }
    return res.status(400).json({ message: "User already exists.", field: "form" });
  }
  catch (e) {
    console.log(e);
    res.status(500).json({ message: "Something went wrong. Try again later.", field: "form" });
  }
});

router.post("/login", loginAttemptLimiter, async (req, res) => {
  const fieldsValid = validateFields(["email", "password"], req.body);

  if (!fieldsValid) {
    return res.status(400).json({ message: "Incorrect username or password.", field: "form" });
  }

  if (!validator.isEmail(req.body.email)) {
    return res.status(400).json({ message: "Invalid email.", field: "email" });
  }

  if (!validator.isLength(req.body.password, { min: 6, max: 254 })) {
    return res.status(400).json({ message: "Password must be at least 6 characters.", field: "password" });
  }

  try {
    const user = await loginUser(req.body);

    if (user) {
      req.session.user = user;
      return res.json(user);
    }
    res.status(400).json({ message: "Incorrect username or password.", field: "form" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Something went wrong. Try again later.", field: "form" });
  }
});

router.get("/logout", (req, res) => {
  if (!req.session.user) {
    return res.sendStatus(204);
  }
  req.session.destroy(err => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
    }
    else {
      res.clearCookie("mr_sid");
      res.sendStatus(204);
    }
  });
});

router.get("/me", async ({ session: { user }}, res) => {
  if (user) {
    console.log(user);
    res.json(user);
  }
  else {
    res.sendStatus(204);
  }
});

function validateFields(requiredFields, presentFields) {
  for (const field of requiredFields) {
    if (!presentFields[field]) {
      return false;
    }
  }
  return true;
}

module.exports = router;
