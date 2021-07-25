const { db } = require("./index.js");

async function fetchStats(userId) {
  return db.oneOrNone("SELECT * FROM stats WHERE user_id = $1", [userId]);
}

async function updateStats(userId, stats) {
  const item = await db.oneOrNone("SELECT * FROM stats WHERE user_id = $1", userId);

  if (item) {
    const mergedStats = mergeStats(stats, item.data);

    return db.none("UPDATE stats SET data = $2 WHERE user_id = $1", [userId, mergedStats]);
  }
  else {
    return db.none("INSERT INTO stats (user_id, data) VALUES($1, $2)", [userId, stats]);
  }
}

function mergeStats(a, b) {
  for (const year of Object.keys(a)) {
    if (!b[year]) {
      b[year] = {};
    }

    for (const month of Object.keys(a[year])) {
      if (!b[year][month]) {
        b[year][month] = {};
      }

      for (const day of Object.keys(a[year][month])) {
        b[year][month][day] = (b[year][month][day] || 0) + a[year][month][day];
      }
    }
  }
  return b;
}


module.exports = {
  fetchStats,
  updateStats
};
