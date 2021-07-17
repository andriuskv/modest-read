const pgp = require("pg-promise")();

const db = pgp(process.env.DATABASE_URL);

(async function() {
  await db.none(`
    CREATE TABLE IF NOT EXISTS users(
      id serial PRIMARY KEY,
      email VARCHAR UNIQUE NOT NULL,
      hash VARCHAR NOT NULL,
      salt VARCHAR NOT NULL
    );
  `);

  try {
    await db.any("SELECT 1 FROM session");
  } catch (e) {
    console.log(e);

    await db.none(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
      WITH (OIDS=FALSE);
      ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
      CREATE INDEX "IDX_session_expire" ON "session" ("expire");
    `);
  }
})();

module.exports = {
  pgp, db
};
