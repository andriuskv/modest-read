const crypto = require("crypto");
const { db } = require("./index.js");

function findUser(email) {
  return db.oneOrNone("SELECT * FROM users WHERE email = $1", email);
}

async function createUser({ email, password }) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 512, "sha512").toString("hex");
  const user = await findUser(email);

  if (user) {
    return null;
  }
  const { id } = await db.one("INSERT INTO users(email, hash, salt) VALUES($1, $2, $3) RETURNING id", [email, hash, salt]);

  return {
    id,
    email
  };
}

async function loginUser({ email, password }) {
  const user = await findUser(email);

  if (user && validatePassword(user, password)) {
    return {
      id: user.id,
      email: user.email
    };
  }
  return null;
}

function validatePassword(user, password) {
  const hash = crypto.pbkdf2Sync(password, user.salt, 10000, 512, "sha512").toString("hex");
  return user.hash === hash;
}

module.exports = {
  findUser,
  createUser,
  loginUser
};
