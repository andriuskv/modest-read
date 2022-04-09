import { createStore, set, setMany, values, get, update, del, clear } from "idb-keyval";
import { getResponse } from "utils";

const store = createStore("modest-keep", "files");
const currentFileStore = createStore("modest-keep-file", "current-file");

async function fetchFiles(settings, user) {
  const [idbFiles, response] = await Promise.all([values(store), user.id ? fetchServerFiles(user.id) : {}]);

  if (response.code === 200) {
    const files = response.files.concat(idbFiles);

    return {
      code: response.code,
      files: settings ? sortFiles(files, settings) : files
    };
  }
  return {
    message:  user.id ? "Could not retrieve user files." : "",
    files: settings ? sortFiles(idbFiles, settings) : idbFiles
  };
}

function fetchServerFiles(userId) {
  return fetch(`/api/files/${userId}`).then(getResponse);
}

function fetchFile(id, userId, type) {
  if (type === "local") {
    return get(id, store);
  }
  return fetchServerFile(id, userId);
}

function fetchServerFile(id, userId) {
  return fetch(`/api/files/${userId}/${id}`).then(getResponse);
}

function fetchCurrentFile(hash) {
  return get(hash, currentFileStore);
}

async function updateFile(data, { id, userId, local }) {
  if (local) {
    await update(id, file => ({ ...file, ...data }), store);
    return true;
  }
  const response = await updateServerFile(data, id, userId);

  return response.code === 204;
}

function updateServerFile(data, fileId, userId) {
  return fetch(`/api/files/${userId}/${fileId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }).then(getResponse);
}

async function deleteFile(id, local, userId) {
  if (local) {
    return del(id, store).then(() => true);
  }
  const response = await deleteServerFile(id, userId);
  return response.code === 204;
}

function deleteServerFile(id, userId) {
  return fetch(`/api/files/${userId}/${id}`, {
    method: "DELETE"
  }).then(getResponse);
}

async function saveFiles(files, user) {
  if (user.email) {
    const response = await saveServerFiles(files, user.id);
    return response.code === 204;
  }
  else {
    return setMany(files.map(file => [file.id, file]), store).then(() => true);
  }
}

function saveServerFiles(data, userId) {
  return fetch(`/api/files/${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }).then(getResponse);
}

function saveFile(file, userId) {
  if (file.local) {
    return set(file.id, file, store);
  }
  else {
    return saveServerFiles([file], userId);
  }
}

async function saveCurrentFile(hash, file) {
  const currentFile = await fetchCurrentFile(hash);

  if (currentFile) {
    return;
  }
  clear(currentFileStore);
  set(hash, file, currentFileStore);
}

async function findFile(hash, userId) {
  const files = await values(store);
  const file = files.find(file => file.hash === hash);

  if (file) {
    return file;
  }
  else if (userId) {
    const response = await findServerFile(hash, userId);

    if (response.code === 200) {
      return response;
    }
  }
}

function findServerFile(hash, userId) {
  return fetch(`/api/files/${userId}?hash=${hash}`).then(getResponse);
}

function getSortingValue(sortBy, file) {
  if (sortBy === "last-accessed") {
    return Math.max(file.accessedAt || 0, file.createdAt);
  }
  else if (sortBy === "file-size") {
    return file.size;
  }
  else if (sortBy === "file-name") {
    // Remove special characters.
    return file.name.toLowerCase().replace(/[^\w\s]/gi, "");
  }
}

function sortFiles(files, { sortBy, sortOrder }) {
  if (sortBy === "last-accessed") {
    // Invert sort order because we want most recently read files to appear first.
    return sortByLastAccessed(files, sortBy, -sortOrder);
  }
  return sortBySortingValue(files, sortBy, sortOrder);
}

function sortBySortingValue(files, sortBy, sortOrder) {
  return [...files].sort((a, b) => {
    const aValue = getSortingValue(sortBy, a);
    const bValue = getSortingValue(sortBy, b);

    if (aValue < bValue) {
      return -sortOrder;
    }
    else if (aValue > bValue) {
      return sortOrder;
    }
    return 0;
  });
}

function sortByLastAccessed(files, sortBy, sortOrder) {
  const [reading, rest] = files.reduce((arr, file) => {
    if (file.status === "reading") {
      arr[0].push(file);
    }
    else {
      arr[1].push(file);
    }
    return arr;
  }, [[], []]);

  return sortBySortingValue(reading, sortBy, sortOrder).concat(sortBySortingValue(rest, sortBy, sortOrder));
}

export {
  fetchFiles,
  fetchFile,
  updateFile,
  deleteFile,
  saveFiles,
  saveFile,
  fetchCurrentFile,
  saveCurrentFile,
  findFile,
  sortFiles
};
