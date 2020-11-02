const settings = JSON.parse(localStorage.getItem("modest-read-settings")) || {
  sortBy: "last-accessed",
  sortOrder: 1,
  showCategories: false,
  layoutType: "grid",
  invertColors: false,
  keepToolbarVisible: false
};

function getSettings() {
  return settings;
}

function setSettings(newSettings) {
  Object.assign(settings, newSettings);
  saveSettings();
}

function setSetting(key, value) {
  settings[key] = value;
  saveSettings();
}

function saveSettings() {
  localStorage.setItem("modest-read-settings", JSON.stringify(settings));
}

export {
  getSettings,
  setSettings,
  setSetting
};
