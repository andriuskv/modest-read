import { createStore, set, setMany, values, get, update, del } from "idb-keyval";
import { dispatchCustomEvent, getResponse } from "utils";

const store = createStore("modest-keep", "files");
const cachedFilesStore = createStore("modest-keep-file-cache", "files");
let fileCache = [];

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

function fetchCachedFile(hash) {
  return get(hash, cachedFilesStore);
}

async function updateFile(data, { id, isLocal, userId }) {
  if (isLocal) {
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

async function deleteFile(id, { isLocal, hash, userId, deleteFromCache = true }) {
  if (deleteFromCache) {
    deleteCachedFile(hash);
  }

  if (isLocal) {
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

async function cacheFile(hash, file) {
  set(hash, file, cachedFilesStore);
}

async function deleteCachedFile(hash) {
  return del(hash, cachedFilesStore).then(() => true);
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
    return sortBySortingValue(files, sortBy, -sortOrder);
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

function isSupportedMimeType(type) {
  return type.startsWith("application/pdf") || type.startsWith("application/epub+zip");
}

async function readItems(items) {
  const filePromises = [];
  const directoryPromises = [];

  for (const item of items) {
    if (item.kind === "file" && (item.type === "" || isSupportedMimeType(item.type))) {
      const entry = item.webkitGetAsEntry();

      if (entry.isDirectory) {
        directoryPromises.push(readDirectory(entry));
      }
      else if (entry.isFile) {
        filePromises.push(readFile(entry));
      }
    }
  }

  const resolvedItems = await Promise.all([...directoryPromises, ...filePromises]);
  let files = [];

  for (const item of resolvedItems) {
    if (Array.isArray(item)) {
      files = files.concat(item);
    }
    else {
      files.push(item);
    }
  }

  return files;
}

function readDirectory(directory) {
  return new Promise(resolve => {
    const reader = directory.createReader();
    const items = [];

    function readEntries() {
      reader.readEntries(async entries => {
        if (entries.length > 0) {
          for (const entry of entries) {
            if (entry.isFile) {
              const file = await readFile(entry);

              if (isSupportedMimeType(file.type)) {
                items.push(file);
              }
            }
          }
          // readEntries returns only 100 entries at a time, so we need to call it multiple times.
          readEntries();
        } else {
          resolve(items);
        }
      });
    }
    readEntries();
  });
}

function readFile(entry) {
  return new Promise(resolve => {
    entry.file(resolve);
  });
}

function handleDragover(event) {
  event.preventDefault();
}

async function handleDrop(event) {
  event.preventDefault();

  if (event.dataTransfer.items.length) {
    const files = await readItems(event.dataTransfer.items);

    dispatchCustomEvent("files", files);
  }
}

function getFileCache() {
  return fileCache;
}

function resetFileCache() {
  fileCache.length = 0;
}

(function initFileHandlers() {
  window.addEventListener("dragover", handleDragover);
  window.addEventListener("drop", handleDrop);

  document.addEventListener("paste", async event => {
    const clipboardItems = await navigator.clipboard.read();
    const blobs = [];

    event.preventDefault();

    for (const clipboardItem of clipboardItems) {
      const types = clipboardItem.types?.filter(type => isSupportedMimeType(type));

      for (const type of types) {
        const blob = await clipboardItem.getType(type);

        blobs.push(blob);
      }
    }

    if (blobs.length) {
      dispatchCustomEvent("files", blobs);
    }
  });

  if ("launchQueue" in window && "files" in window.LaunchParams.prototype) {
    window.launchQueue.setConsumer(async launchParams => {
      if (!launchParams.files.length) {
        return;
      }
      const blobs = [];

      for (const fileHandle of launchParams.files) {
        const blob = await fileHandle.getFile();

        blobs.push(blob);
      }

      if (blobs.length) {
        fileCache = [...blobs];

        dispatchCustomEvent("files", blobs);
      }
    });
  }
})();

export {
  fetchFiles,
  fetchFile,
  updateFile,
  deleteFile,
  saveFiles,
  saveFile,
  fetchCachedFile,
  cacheFile,
  findFile,
  sortFiles,
  getFileCache,
  resetFileCache
};
