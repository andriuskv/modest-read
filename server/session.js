const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);

function getSession() {
  return session({
    name: "mr_sid",
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      sameSite: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 120
    },
    store: new pgSession({
      conString: process.env.DATABASE_URL
    })
  });
}

module.exports = {
  getSession
};
