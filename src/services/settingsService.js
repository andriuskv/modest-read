import { copyObject } from "utils";

const settings = initSettings();

function initSettings() {
  const settings = JSON.parse(localStorage.getItem("modest-read-settings")) || {};

  return copyObject(settings, {
    sortBy: "last-accessed",
    sortOrder: 1,
    layoutType: "grid",
    toolbarVisible: true,
    navigationAreasDisabled: false,
    epub: {
      viewMode: "single",
      spreadPages: false,
      theme: "white",
      textOpacity: 1,
      scale: {
        name: "1",
        currentScale: 1,
        displayValue: "100%"
      },
      margin: {
        horizontal: 100,
        top: 40,
        bottom: 20
      }
    },
    pdf: {
      viewMode: "multi",
      invertColors: false
    }
  });
}

function getSettings() {
  return settings;
}

function getSetting(key) {
  return settings[key];
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
  getSetting,
  setSettings,
  setSetting
};
