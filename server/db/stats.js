const { db } = require("./index.js");

function fetchStats(userId) {
  return db.oneOrNone("SELECT * FROM stats WHERE user_id = $1 LIMIT 1", userId);
}

async function updateStats(stats, userId) {
  const row = await fetchStats(userId);

  if (row) {
    const mergedStats = mergeStats(stats, row.data);

    return db.none("UPDATE stats SET data = $2 WHERE user_id = $1", [userId, mergedStats]);
  }
  return db.none("INSERT INTO stats (user_id, data) VALUES($1, $2)", [userId, stats]);
}

function resetStats(userId) {
  return db.none("DELETE FROM stats WHERE user_id = $1", [userId]);
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
  updateStats,
  resetStats
};
