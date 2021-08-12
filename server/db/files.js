const { db } = require("./index.js");

function getRow(id) {
  return db.oneOrNone("SELECT * FROM files WHERE id = $1 LIMIT 1", id);
}

async function saveFiles(files, id) {
  const row = await getRow(id);
  const filesObj = files.reduce((obj, file) => {
    obj[file.id] = file;
    return obj;
  }, {});

  if (row) {
    for (const file of files) {
      row.data[file.id] = file;
    }
    return db.none("UPDATE files SET data = $2 WHERE id = $1", [id, row.data]);
  }
  return db.none("INSERT INTO files (id, data) VALUES($1, $2)", [id, filesObj]);
}

async function getFiles(id) {
  const row = await getRow(id);

  if (row) {
    const files = [];

    for (const key of Object.keys(row.data)) {
      files.push(row.data[key]);
    }
    return files;
  }
  return [];
}

async function getFile(rowId, { id, hash }) {
  if (id) {
    const data = await db.oneOrNone("SELECT data ->> $2 AS $2:name FROM files WHERE id = $1", [rowId, id]);

    if (data) {
      return JSON.parse(data[id]);
    }
  }
  else if (hash) {
    const row = await getRow(rowId);

    for (const key of Object.keys(row.data)) {
      const file = row.data[key];

      if (file.hash === hash) {
        return file;
      }
    }
  }
}

async function updateFile(data, rowId, fileId) {
  const row = await getRow(rowId);

  if (row) {
    row.data[fileId] = { ...row.data[fileId], ...data };
    await db.none("UPDATE files SET data = $2 WHERE id = $1", [rowId, row.data]);
    return true;
  }
  return false;
}

async function deleteFile(rowId, fileId) {
  const row = await getRow(rowId);

  if (row) {
    delete row.data[fileId];
    await db.none("UPDATE files SET data = $2 WHERE id = $1", [rowId, row.data]);
    return true;
  }
  return false;
}

module.exports = {
  saveFiles,
  getFiles,
  getFile,
  updateFile,
  deleteFile
};
