import { Store, set, get, keys, del } from "idb-keyval";

const store = new Store("ModestKeep", "files");

function fetchIDBFiles(settings) {
  return keys(store).then(keys => Promise.all(keys.map(fetchIDBFile)))
    .then(files => sortFiles(files, settings))
    .catch(e => {
      console.log(e);
      return [];
    });
}

function fetchIDBFile(id) {
  return get(id, store);
}

function saveFile(snippet) {
  set(snippet.id, snippet, store);
}

function deleteIDBFile(id) {
  return del(id, store).then(() => true);
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
  sortFiles
};
