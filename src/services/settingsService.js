const settings = JSON.parse(localStorage.getItem("settings")) || {
  showCategories: false,
  layoutType: "grid",
  invertColors: false,
  keepToolbarVisible: false
};

function getSettings() {
  return settings;
}

function setSetting(key, value) {
  settings[key] = value;
  localStorage.setItem("settings", JSON.stringify(settings));
}

export {
  getSettings,
  setSetting
};
