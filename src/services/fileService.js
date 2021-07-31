import { createStore, set, get, getMany, keys, del } from "idb-keyval";

const store = createStore("modest-keep", "files");
const currentFileStore = createStore("modest-keep-file", "current-file");
let saveTimeoutId = 0;

async function fetchIDBFiles(settings) {
  try {
    const ids = await keys(store);
    const files = await getMany(ids, store);

    if (settings) {
      return sortFiles(files, settings);
    }
    return files;
  } catch (e) {
    console.log(e);
    return [];
  }
}

function fetchIDBFile(id) {
  return get(id, store);
}

function saveFile(file) {
  clearTimeout(saveTimeoutId);

  saveTimeoutId = setTimeout(() => {
    set(file.id, file, store);
  }, 4000);
}

function deleteIDBFile(id) {
  return del(id, store).then(() => true);
}

function fetchCurrentFile() {
  return get("file", currentFileStore);
}

async function saveCurrentFile(file) {
  const currentFile = await fetchCurrentFile();

  if (currentFile?.name === file.name) {
    return;
  }
  set("file", file, currentFileStore);
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
  fetchIDBFiles,
  fetchIDBFile,
  saveFile,
  deleteIDBFile,
  fetchCurrentFile,
  saveCurrentFile,
  sortFiles
};
