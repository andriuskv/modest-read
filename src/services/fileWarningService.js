const settings = JSON.parse(localStorage.getItem("file-warning")) || {
  saveFile: false,
  hide: false
};

function getSettings() {
  return settings;
}

function setSettings(newSettings) {
  Object.assign(settings, newSettings);
  saveSettings();
}

function saveSettings() {
  localStorage.setItem("file-warning", JSON.stringify(settings));
}

export {
  getSettings,
  setSettings
};
