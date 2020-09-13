import { Store, set, get, keys, del } from "idb-keyval";

const store = new Store("ModestKeep", "files");

function fetchIDBFiles() {
  return keys(store).then(keys => Promise.all(keys.map(fetchIDBFile)))
    .then(sortFiles)
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

function sortFiles(files) {
  const [reading, rest] = files.reduce((arr, file) => {
    if (file.status === "reading") {
      arr[0].push(file);
    }
    else {
      arr[1].push(file);
    }
    return arr;
  }, [[], []]);

  return sortReadingFiles(reading).concat(sortRestFiles(rest));
}

function sortReadingFiles(files) {
  return files.sort((a, b) => {
    return b.accessedAt - a.accessedAt;
  });
}

function sortRestFiles(files) {
  return files.sort((a, b) => {
    return a.createdAt - b.createdAt;
  });
}

export {
  fetchIDBFiles,
  fetchIDBFile,
  saveFile,
  deleteIDBFile,
  sortFiles
};
