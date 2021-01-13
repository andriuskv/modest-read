import { createStore, set, get } from "idb-keyval";

const store = createStore("ModestKeep2", "current-file");

function fetchCurrentFile() {
  return get("file", store);
}

async function saveCurrentFile(file) {
  const currentFile = await fetchCurrentFile();

  if (currentFile?.name === file.name) {
    return;
  }
  set("file", file, store);
}

export {
  fetchCurrentFile,
  saveCurrentFile
};
