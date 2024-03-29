const pgp = require("pg-promise")();

const db = pgp({
  connectionString: process.env.DATABASE_URL,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  idle_in_transaction_session_timeout: 60000,
  maxLifetime: 600000,
  allowExitOnIdle: true
});

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

  await db.none(`
    CREATE TABLE IF NOT EXISTS files(
      id integer UNIQUE NOT NULL,
      data jsonb NOT NULL
    );
  `);

  await db.none(`
    CREATE TABLE IF NOT EXISTS stats(
      user_id integer UNIQUE NOT NULL,
      data jsonb NOT NULL
    );
  `);
})();

module.exports = {
  pgp, db
};
