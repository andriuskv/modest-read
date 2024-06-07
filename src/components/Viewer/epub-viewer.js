import { v4 as uuidv4 } from "uuid";
import { getElementByAttr, dispatchCustomEvent, getEpubCoverUrl, getFileSizeString } from "../../utils";
import * as fileService from "../../services/fileService";
import { getSettings, setSettings } from "../../services/settingsService";
import { startCounting, stopCounting } from "../../services/statsService";
import { initOutline } from "./outline";

const settings = getSettings();
const minScale = 0.333325;
const maxScale = 13.333;
let book = null;
let rendition = null;
let fileMetadata = null;
let scale = null;
let epubElement = null;
let dropdownId = "";
let hideDropdown = null;
let previousTheme = "";
let saveTimeoutId = 0;
let dataToSave = {};
let user = {};
let mouseDownStartPos = null;
let cleanupController = null;

async function initEpubViewer(container, { metadata, blob }, loggedUser) {
  const { default: epubjs } = await import("epubjs");
  user = loggedUser;
  book = epubjs(blob);
  fileMetadata = metadata;
  scale = settings.epub.scale;
  epubElement = container;
  rendition = getRendition(settings.epub.viewMode, settings.epub.spreadPages, settings.epub.margin);
  cleanupController = new AbortController();
  document.body.style.overscrollBehavior = "none";

  await book.ready;
  await book.locations.generate(1650);

  metadata.pageCount = book.locations.length();
  metadata.pageNumber = metadata.location ? book.locations.locationFromCfi(metadata.location) + 1 : 1;

  rendition.on("relocated", handleRelocation);
  rendition.on("click", handleClickOnRendition);
  rendition.on("mousedown", handleMouseDownOnRendition);
  rendition.display(metadata.location);

  document.addEventListener("keydown", handleKeyDown);
  window.addEventListener("dropdown-visible", handleDropdownVisibility);
  window.addEventListener("blur", blurIframe);

  updateFile(metadata, { accessedAt: Date.now() }, true);
  startCounting(user);
}

function blurIframe() {
  const element = document.activeElement;

  if (element instanceof HTMLIFrameElement) {
    requestAnimationFrame(() => {
      element.blur();
    });
  }
}

function updateFile(file, data, skipWaiting = false) {
  Object.assign(file, data);
  Object.assign(dataToSave, data);

  clearTimeout(saveTimeoutId);
  saveTimeoutId = setTimeout(() => {
    fileService.updateFile(dataToSave, {
      id: file.id,
      isLocal: file.local,
      userId: user.id
    });
    dataToSave = {};
  }, skipWaiting ? 1 : 10000);
}

function handleDropdownVisibility({ detail }) {
  dropdownId = detail.id;
  hideDropdown = detail.hide;
}

function initToolbar() {
  initTheme();
  initTextOpacity();
  initScale(scale);
  initPage(fileMetadata.pageNumber, fileMetadata.pageCount);
  initViewMode(settings.epub.viewMode, settings.epub.spreadPages);
  initOutline(getOutline, goToDestination);
}

function initViewMode(viewMode, spreadPages) {
  const viewModesElement = document.getElementById("js-viewer-view-modes");
  const [singlePageViewElement, multiPageViewElement] = viewModesElement.children;
  const spreadPagesElement = document.getElementById("js-viewer-spread-pages");

  spreadPagesElement.checked = spreadPages;

  if (viewMode === "single") {
    singlePageViewElement.classList.add("active");
  }
  else {
    multiPageViewElement.classList.add("active");
  }
  spreadPagesElement.addEventListener("click", handleSpreadPagesSetting);
  viewModesElement.addEventListener("click", setViewMode);
}

function initTheme() {
  document.getElementById("js-viewer-themes").addEventListener("click", setTheme);
}

function initTextOpacity() {
  const element = document.getElementById("js-viewer-text-opacity");

  element.value = settings.epub.textOpacity;
  element.addEventListener("change", setTextOpacity);
}

function cleanupTextOpacity() {
  document.getElementById("js-viewer-text-opacity").removeEventListener("change", setTextOpacity);
}

function cleanupViewMode() {
  const viewModesElement = document.getElementById("js-viewer-view-modes");
  const spreadPagesElement = document.getElementById("js-viewer-spread-pages");

  viewModesElement.querySelector(`[data-mode=${settings.epub.viewMode}]`).classList.remove("active");
  viewModesElement.removeEventListener("click", setViewMode);

  if (spreadPagesElement) {
    spreadPagesElement.removeEventListener("click", handleSpreadPagesSetting);
  }
}

function setTheme(event) {
  const element = getElementByAttr("data-theme", event.target, event.currentTarget);

  if (!element) {
    return;
  }
  settings.epub.theme = element.attrValue;

  applyTheme();
  setSettings(settings);
}

function setTextOpacity(event) {
  settings.epub.textOpacity = Number(event.target.value);

  applyTheme();
  setSettings(settings);
}

function resetFontSize(content) {
  for (const sheet of content.document.styleSheets) {
    for (const rule of sheet.rules) {
      if (rule.style?.fontSize && rule.selectorText !== "html") {
        if (rule.style.fontSize.endsWith("pt")) {
          const px = Math.round(Number.parseFloat(rule.style.fontSize) * 1.3333);
          const rem = px / 16;

          rule.style.fontSize = `${rem}rem`;
        }
        else if (rule.style.fontSize.endsWith("px")) {
          const px = Number.parseFloat(rule.style.fontSize);
          const rem = px / 16;
          rule.style.fontSize = `${rem}rem`;
        }
        else if (rule.style.fontSize.endsWith("%")) {
          const rem = Number.parseFloat(rule.style.fontSize) / 100;
          rule.style.fontSize = `${rem}rem`;
        }
        else if (rule.style.fontSize.endsWith("em")) {
          rule.style.fontSize = `${Number.parseFloat(rule.style.fontSize)}rem`;
        }
        else {
          const keywordMap = {
            "xx-small": "0.5625",
            "x-small": "0.625",
            "small": "0.8333",
            "medium": "1",
            "large": "1.125",
            "x-large": "1.5",
            "xx-large": "2",
            "xxx-large": "3"
          };

          if (keywordMap[rule.style.fontSize]) {
            rule.style.fontSize = `${keywordMap[rule.style.fontSize]}rem`;
          }
        }
      }
    }
  }
}

function applyTheme() {
  const { theme, textOpacity } = settings.epub;
  const themes = {
    black: {
      "body": {
        "color": `rgb(255, 255, 255, ${textOpacity})`,
        "background-color": "black"
      },
      "a": {
        "color": `rgb(255, 255, 255, ${textOpacity})`
      }
    },
    white: {
      "body": {
        "color": `rgb(0, 0, 0, ${textOpacity})`,
        "background-color": "white"
      },
      "a": {
        "color": `rgb(0, 0, 0, ${textOpacity})`
      }
    },
    grey: {
      "body": {
        "color": `rgb(255, 255, 255, ${textOpacity})`,
        "background-color": "#1d1c1b"
      },
      "a": {
        "color": `rgb(255, 255, 255, ${textOpacity})`
      }
    },
    orange: {
      "body": {
        "color": `rgb(0, 0, 0, ${textOpacity})`,
        "background-color": "#FBF0D9"
      },
      "a": {
        "color": `rgb(0, 0, 0, ${textOpacity})`
      }
    }
  };

  rendition.getContents().forEach(c => {
    for (const styleSheet of c.document.styleSheets) {
      for (const rule of styleSheet.rules) {
        if (rule.style?.color) {
          rule.style.removeProperty("color");
        }
      }
    }
    c.addStylesheetRules(themes[theme]);
  });

  if (previousTheme) {
    epubElement.classList.remove(`theme-${previousTheme}`);
  }
  epubElement.classList.add(`theme-${theme}`);
  previousTheme = theme;
}

function handleRelocation(locations) {
  const { cfi, location, index } = locations.start;
  const pageNumber = location + 1;

  updateFile(fileMetadata, {
    location: cfi,
    pageNumber: book.locations.locationFromCfi(cfi) + 1
  });
  updatePageInputElement(pageNumber);
  updatePageBtnElementState(pageNumber, book.locations.length(), { location, index, atStart: locations.atStart });
}

function handleKeyDown(event) {
  if (event.ctrlKey) {
    if (event.key === "=") {
      event.preventDefault();
      zoomIn();
    }
    if (event.key === "-") {
      event.preventDefault();
      zoomOut();
    }
  }
  else if (event.key === "ArrowLeft") {
    previousPage();
  }
  else if (event.key === "ArrowRight") {
    nextPage();
  }
}

function handleClickOnRendition(event) {
  if (dropdownId) {
    dropdownId = "";
    hideDropdown();
  }

  if (event.target.nodeName === "A" && event.target.href) {
    const splitPathItems = new URL(event.target.href).pathname.split("/");
    // Remove leading "/"
    const pathname = splitPathItems.slice(1).join("/");
    const unescapedPathname = unescape(pathname);

    if (pathname !== unescapedPathname) {
      rendition.display(unescapedPathname);
    }
    return;
  }

  if (settings.navigationAreasDisabled) {
    return;
  }

  // Disable navigation to different page if mouse down and up positions differ
  if (event.screenX !== mouseDownStartPos.x || event.screenY !== mouseDownStartPos.y) {
    return;
  }
  const width = window.innerWidth;
  const height = window.innerHeight;

  const offsetY = window.outerHeight - window.innerHeight;

  const x = event.screenX;
  const y = event.screenY - offsetY;

  const ratioX = x / width;
  const ratioY = y / height;

  if (ratioY > 0.8 || ratioY > 0.2 && ratioX > 0.8) {
    nextPage();
  }
  else if (ratioY < 0.2 || ratioY < 0.8 && ratioX < 0.2) {
    previousPage();
  }
  else {
    dispatchCustomEvent("toolbar-toggle");
  }
}

function handleMouseDownOnRendition(event) {
  mouseDownStartPos = {
    x:  event.screenX,
    y:  event.screenY
  };
}

function handleSpreadPagesSetting({ target }) {
  settings.epub.spreadPages = target.checked;

  resetRendition(settings.epub.viewMode, target.checked, settings.epub.margin);
  setSettings(settings);
}

function cleanupEpubViewer(reloading) {
  if (reloading) {
    if (epubElement) {
      epubElement.innerHTML = "";
      epubElement.classList.remove(`theme-${settings.epub.theme}`);
    }
    clearTimeout(saveTimeoutId);
    cleanupViewMode();
    cleanupTextOpacity();
  }
  cleanupController.abort();
  cleanupController = null;
  document.body.style.overscrollBehavior = "";
  updateFile(fileMetadata, dataToSave, true);
  stopCounting();

  document.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("dropdown-visible", handleDropdownVisibility);
  window.removeEventListener("blur", blurIframe);
}

function initPage(pageNumber, pageCount) {
  const previousPageElement = document.getElementById("js-viewer-previous-page");
  const nextPageElement = document.getElementById("js-viewer-next-page");
  const pageInputContainerElement = document.getElementById("js-viewer-page-input-container");
  const pageInputElement = document.getElementById("js-viewer-page-input");

  updatePageInputElement(pageNumber);

  pageInputContainerElement.lastElementChild.textContent = `of ${pageCount}`;

  pageInputContainerElement.addEventListener("click", handlePageInputContainerClick);

  previousPageElement.addEventListener("click", previousPage);
  nextPageElement.addEventListener("click", nextPage);

  pageInputElement.addEventListener("focus", handlePageInputFocus);
  pageInputElement.addEventListener("blur", handlePageInputBlur);
  pageInputElement.addEventListener("keydown", handlePageInputKeydown);
}

function updatePageInputElement(pageNumber) {
  const pageInputElement = document.getElementById("js-viewer-page-input");

  pageInputElement.value = pageNumber;
  pageInputElement.style.width = `${pageNumber.toString().length}ch`;
}

function updatePageBtnElementState(pageNumber, pageCount, { location, index, atStart }) {
  const previousPageElement = document.getElementById("js-viewer-previous-page");
  const nextPageElement = document.getElementById("js-viewer-next-page");
  const { viewMode, spreadPages } = settings.epub;

  if (atStart || location === 0 && index === 0) {
    previousPageElement.disabled = true;
  }
  else if (pageNumber === pageCount || viewMode === "single" && spreadPages && location + 2 === pageCount) {
    nextPageElement.disabled = true;
  }
  else {
    previousPageElement.disabled = false;
    nextPageElement.disabled = false;
  }
}

function goToDestination(href) {
  rendition.display(href.split(/viewer\/.*?\//g)[1]);
}

function getOutlineItem(item) {
  return {
    title: item.label,
    href: `${window.location.href}/${item.href}`,
    items: item.subitems.map(getOutlineItem)
  };
}

async function getOutline() {
  const navigation = await book.loaded.navigation;

  return Array.isArray(navigation.toc) ? navigation.toc.map(getOutlineItem) : [];
}

function previousPage() {
  rendition.prev();
}

function nextPage() {
  rendition.next();
}

function initScale(scale) {
  updateZoomElementValue(scale);

  for (const element of document.querySelectorAll(".viewer-toolbar-tool-btn")) {
    const type = element.getAttribute("data-type");

    if (type === "in") {
      element.addEventListener("click", zoomIn, { signal: cleanupController.signal });
    }
    else if (type === "out") {
      element.addEventListener("click", zoomOut, { signal: cleanupController.signal });
    }
  }
  const zoomOptionsElement = document.getElementById("js-viewer-toolbar-zoom-dropdown-options");
  const zoomOptionElement = zoomOptionsElement.querySelector(`[data-value="${scale.name}"]`);

  if (zoomOptionElement) {
    zoomOptionElement.classList.add("active");
  }
  zoomOptionsElement.addEventListener("click", handleZoomOptionClick, { signal: cleanupController.signal });
}

function updateZoomElementValue(scale) {
  for (const element of document.querySelectorAll(".viewer-zoom-value")) {
    element.textContent = scale.displayValue;
  }
}

function zoomIn() {
  setScale(Math.min(scale.currentScale * 1.1, maxScale));
  cleanupActiveZoomOption();
}

function zoomOut() {
  setScale(Math.max(scale.currentScale / 1.1, minScale));
  cleanupActiveZoomOption();
}

function cleanupActiveZoomOption() {
  const zoomOptionsElement = document.getElementById("js-viewer-toolbar-zoom-dropdown-options");

  if (!zoomOptionsElement) {
    return;
  }
  const optionElement = zoomOptionsElement.querySelector(".active");

  if (optionElement) {
    optionElement.classList.remove("active");
  }
}

function handleZoomOptionClick({ target, currentTarget }) {
  const value = target.getAttribute("data-value");

  if (value) {
    const name = target.textContent;
    const prevActiveElement = currentTarget.querySelector(".active");

    if (prevActiveElement) {
      prevActiveElement.classList.remove("active");
    }
    target.classList.add("active");
    setScale(value, name);
  }
}

function setScale(value, name = "custom") {
  scale.name = name;
  scale.currentScale = value;
  scale.displayValue = `${Math.round(value * 100)}%`;

  settings.epub.scale = scale;

  rendition.themes.default({ "html": { "font-size": `${value * 100}% !important` }});
  updateZoomElementValue(scale);
  setSettings(settings);
}

async function setViewMode(event) {
  const element = getElementByAttr("data-mode", event.target, event.currentTarget);

  if (!element) {
    return;
  }
  const { attrValue: mode } = element;

  if (mode === settings.epub.viewMode) {
    return;
  }
  const [singlePageViewElement, multiPageViewElement] = event.currentTarget.children;

  singlePageViewElement.classList.toggle("active");
  multiPageViewElement.classList.toggle("active");
  document.getElementById("js-viewer-spread-pages-setting").classList.toggle("hidden");

  settings.epub.viewMode = mode;

  resetRendition(mode, settings.epub.spreadPages, settings.epub.margin);
  setSettings(settings);
}

function getRendition(viewMode, spreadPages, margin) {
  const media = matchMedia("(max-width: 480px)");
  let horizontalMargin = margin.horizontal;

  if (media.matches && horizontalMargin > 20) {
    horizontalMargin = 20;
  }
  const options = {
    height: document.documentElement.offsetHeight,
    // Only half of gap is visible in single page mode, in multi page mode it is ignored.
    gap: horizontalMargin * 2 || 0.1
  };

  if (viewMode === "single") {
    options.flow = "paginated";
    options.manager = "default";
    options.spread = spreadPages ? "always" : "none";
  }
  else if (viewMode === "multi") {
    options.flow = "scrolled";
    options.manager = "continuous";
  }
  const rendition = book.renderTo(epubElement, options);

  rendition.hooks.content.register(resetFontSize);
  rendition.hooks.content.register(applyTheme);
  rendition.themes.default({
    "html": { "font-size": `${scale.currentScale * 100}% !important` },
    "body": {
      "padding-top": `${margin.top}px !important`,
      "padding-bottom": `${margin.bottom}px !important`,
      // Padding left/right doesn't have an effect in single page view mode
      "padding-left": `${horizontalMargin}px !important`,
      "padding-right": `${horizontalMargin}px !important`
    },
    "::selection": { "background-color": "hsla(260, 48%, 52%, 0.4)" }
  });

  return rendition;
}

function resetRendition(viewMode, spreadPages, margin) {
  epubElement.innerHTML = "";

  rendition.off("relocated", handleRelocation);
  rendition.off("click", handleClickOnRendition);
  rendition.off("mousedown", handleMouseDownOnRendition);

  rendition = getRendition(viewMode, spreadPages, margin);

  rendition.on("relocated", handleRelocation);
  rendition.on("click", handleClickOnRendition);
  rendition.on("mousedown", handleMouseDownOnRendition);
  rendition.display(fileMetadata.location);
}

function updateEpubMargin(newMargin) {
  resetRendition(settings.epub.viewMode, settings.epub.spreadPages, newMargin);
}

async function getNewEpubFile(blob, user) {
  const { default: epubjs } = await import("epubjs");
  book = epubjs(blob);

  await book.ready;

  const [metadata, coverImage] = await Promise.all([
    book.loaded.metadata,
    getEpubCoverUrl(book),
    book.locations.generate(1650)
  ]);
  const params = {};

  if (!user.email) {
    params.local = true;
  }

  if (metadata.title) {
    params.title = metadata.title;
  }

  if (metadata.creator) {
    params.author = metadata.creator;
  }

  return {
    coverImage,
    id: uuidv4(),
    name: blob.name,
    type: "epub",
    createdAt: Date.now(),
    size: blob.size,
    sizeString: getFileSizeString(blob.size),
    pageNumber: 1,
    pageCount: book.locations.length(),
    ...params
  };
}

function handlePageInputContainerClick(event) {
  if (event.target !== event.currentTarget.firstElementChild) {
    event.currentTarget.firstElementChild.focus();
  }
}

function handlePageInputFocus({ target }) {
  const { pageCount } = fileMetadata;
  const width = pageCount < 1000 ? 3 : pageCount.toString().length;

  target.style.width = `${width}ch`;
  target.select();
}

function handlePageInputBlur({ target }) {
  const { location, pageCount } = fileMetadata;
  const pageNumber = book.locations.locationFromCfi(location);
  let number = parseInt(target.value, 10);

  if (Number.isNaN(number)) {
    target.value = pageNumber;
    target.style.width = `${pageNumber.toString().length}ch`;
    return;
  }
  else if (number < 1) {
    number = 1;
  }
  else if (number > pageCount) {
    number = pageCount;
  }
  const cfi = book.locations.cfiFromLocation(number);
  target.style.width = `${number.toString().length}ch`;

  rendition.display(cfi);
}

function handlePageInputKeydown(event) {
  if (event.key === "Enter") {
    event.target.blur();
  }
}

export {
  initEpubViewer,
  cleanupEpubViewer,
  initToolbar,
  updateEpubMargin,
  getNewEpubFile
};
