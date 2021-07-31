import { v4 as uuidv4 } from "uuid";
import { getElementByAttr, getEpubCoverUrl, getFileSizeString } from "../../utils";
import { saveFile, saveCurrentFile } from "../../services/fileService";
import { startCounting, stopCounting } from "../../services/statsService";
import { initOutline } from "./outline";

const minScale = 0.333325;
const maxScale = 13.333;
let book = null;
let rendition = null;
let fileMetadata = null;
let scale = null;
let epubElement = null;
let scrollTimeout = 0;
let save = true;
let dropdownId = "";
let hideDropdown = null;
let previousTheme = "";

async function initEpubViewer(container, { metadata, blob, save = true }, user) {
  const { default: epubjs } = await import("epubjs");
  book = epubjs(blob);
  fileMetadata = metadata;
  scale = metadata.scale || getDefaultScale();
  epubElement = container;
  rendition = getRendition(metadata.viewMode);

  initTheme();
  initScale(scale);
  initPage(metadata.pageNumber, metadata.pageCount);
  initViewMode(metadata.viewMode);
  initOutline(getOutline, goToDestination);

  await book.ready;

  if (metadata.storedPosition) {
    await book.locations.load(metadata.storedPosition);
  }
  else {
    await book.locations.generate(1650);

    metadata.storedPosition = book.locations.save();
    metadata.pageCount = book.locations.length();
  }
  metadata.pageNumber = metadata.location ? book.locations.locationFromCfi(metadata.location) + 1 : 1;

  rendition.on("relocated", handleRelocation);
  rendition.on("keydown", handleKeyDownOnRendition);
  rendition.on("click", handleClickOnRendition);
  rendition.display(metadata.location);

  setSaveEpubFile(save);

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("dropdown-visible", handleDropdownVisibility);

  if (save) {
    if (metadata.status !== "have read") {
      if (metadata.pageCount === 1) {
        metadata.status = "have read";
      }
      else {
        metadata.status = "reading";
      }
    }
    metadata.accessedAt = Date.now();

    saveFile(metadata);
    saveCurrentFile(blob);
  }
  startCounting(user);
}

function handleDropdownVisibility({ detail }) {
  dropdownId = detail.id;
  hideDropdown = detail.hide;
}

function initViewMode(viewMode) {
  const viewModesElement = document.getElementById("js-viewer-view-modes");
  const [singlePageViewElement, spreadPageViewElement] = viewModesElement.children;

  if (viewMode === "single") {
    singlePageViewElement.classList.add("active");
  }
  else {
    spreadPageViewElement.classList.add("active");
  }
  viewModesElement.addEventListener("click", setViewMode);
}

function initTheme() {
  document.getElementById("js-viewer-themes").addEventListener("click", setTheme);
}

function cleanupViewMode(viewMode) {
  const viewModesElement = document.getElementById("js-viewer-view-modes");

  viewModesElement.querySelector(`[data-mode=${viewMode}]`).classList.remove("active");
  viewModesElement.removeEventListener("click", setViewMode);
}

function setTheme(event) {
  const element = getElementByAttr("data-theme", event.target, event.currentTarget);

  if (!element) {
    return;
  }
  fileMetadata.theme = element.attrValue;
  applyTheme();

  if (save) {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      saveFile(fileMetadata);
    }, 1000);
  }
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
  let { theme } = fileMetadata;

  if (!theme) {
    theme = "white";
  }
  const themes = {
    black: {
      "body": {
        "color": "white",
        "background-color": "black"
      },
      "a": {
        "color": "white"
      }
    },
    white: {
      "body": {
        "color": "black",
        "background-color": "white"
      },
      "a": {
        "color": "black"
      }
    },
    grey: {
      "body": {
        "color": "white",
        "background-color": "#1d1c1b"
      },
      "a": {
        "color": "white"
      }
    },
    orange: {
      "body": {
        "color": "black",
        "background-color": "#FBF0D9"
      },
      "a": {
        "color": "black"
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
    epubElement.firstElementChild.classList.remove(`theme-${previousTheme}`);
  }
  epubElement.firstElementChild.classList.add(`theme-${theme}`);
  previousTheme = theme;
}

function handleRelocation(locations) {
  const { cfi, location, index } = locations.start;
  const pageNumber = location + 1;

  fileMetadata.location = cfi;
  fileMetadata.pageNumber = book.locations.locationFromCfi(cfi) + 1;

  updatePageInputElement(pageNumber);
  updatePageBtnElementState(pageNumber, book.locations.length(), { location, index, atStart: locations.atStart });

  if (save) {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      saveFile(fileMetadata);
    }, 1000);
  }
}

function handleKeyDownOnRendition(event) {
  if (event.ctrlKey) {
    document.activeElement.blur();
  }
}

function handleClickOnRendition() {
  if (dropdownId) {
    dropdownId = "";
    hideDropdown();
  }
}

function cleanupEpubViewer() {
  if (epubElement) {
    epubElement.innerHTML = "";
  }
  stopCounting();
  cleanupViewMode(fileMetadata.viewMode);
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("dropdown-visible", handleDropdownVisibility);
}

function setSaveEpubFile(saveFile) {
  save = saveFile;
}

function initPage(pageNumber, pageCount) {
  const previousPageElement = document.getElementById("js-viewer-previous-page");
  const nextPageElement = document.getElementById("js-viewer-next-page");
  const pageInputContainerElement = document.getElementById("js-viewer-page-input-container");
  const pageInputElement = document.getElementById("js-viewer-page-input");

  updatePageInputElement(pageNumber);
  showMobileNavBtn();

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

  if (atStart || location === 0 && index === 0) {
    previousPageElement.disabled = true;
  }
  else if (pageNumber === pageCount || fileMetadata.viewMode === "spread" && location + 2 === pageCount) {
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

function showMobileNavBtn() {
  const previousPageElement = document.getElementById("js-viewer-nav-previous-btn");
  const nextPageElement = document.getElementById("js-viewer-nav-next-btn");

  previousPageElement.classList.add("visible");
  nextPageElement.classList.add("visible");
  previousPageElement.addEventListener("click", previousPage);
  nextPageElement.addEventListener("click", nextPage);
}

function previousPage() {
  rendition.prev();
}

function nextPage() {
  rendition.next();
}

function initScale(scale) {
  const zoomOutElement = document.getElementById("js-viewer-zoom-out");
  const zoomInElement = document.getElementById("js-viewer-zoom-in");

  updateScaleElement(scale);

  zoomOutElement.addEventListener("click", zoomOut);
  zoomInElement.addEventListener("click", zoomIn);
  document.getElementById("js-viewer-scale-select").addEventListener("change", handleScaleSelect);
}

function updateScaleElement(scale) {
  const element = document.getElementById("js-viewer-scale-select");

  element.value = scale.name;
  element.firstElementChild.textContent = `${scale.displayValue}%`;
}

function zoomIn() {
  setScale(Math.min(scale.currentScale * 1.1, maxScale));
}

function zoomOut() {
  setScale(Math.max(scale.currentScale / 1.1, minScale));
}

async function handleScaleSelect({ target }) {
  const { value } = target;

  setScale(value, value);
}

function setScale(value, name = "custom") {
  scale.name = name;
  scale.currentScale = value;
  scale.displayValue = Math.round(value * 100);
  fileMetadata.scale = scale;

  updateScaleElement(scale);
  rendition.themes.default({ "html": { "font-size": `${value * 100}% !important` }});

  if (save) {
    saveFile(fileMetadata);
  }
}

function setViewMode(event) {
  const element = getElementByAttr("data-mode", event.target, event.currentTarget);

  if (!element) {
    return;
  }
  const { attrValue: mode } = element;

  if (mode === fileMetadata.viewMode) {
    return;
  }
  const [singlePageViewElement, spreadPageViewElement] = event.currentTarget.children;

  singlePageViewElement.classList.toggle("active");
  spreadPageViewElement.classList.toggle("active");

  fileMetadata.viewMode = mode;
  epubElement.innerHTML = "";

  rendition.off("relocated", handleRelocation);

  rendition = getRendition(mode);

  rendition.on("relocated", handleRelocation);
  rendition.on("keydown", handleKeyDownOnRendition);
  rendition.on("click", handleClickOnRendition);
  rendition.display(fileMetadata.location);

  if (save) {
    saveFile(fileMetadata);
  }
}

function getRendition(viewMode) {
  const options = {
    flow: "paginated",
    height: document.documentElement.offsetHeight - 40
  };

  if (viewMode === "single") {
    options.spread = "none";
  }
  const rendition = book.renderTo(epubElement, options);

  rendition.hooks.content.register(resetFontSize);
  rendition.hooks.content.register(applyTheme);
  rendition.themes.default({
    "html": { "font-size": `${scale.currentScale * 100}% !important`},
    "::selection": { "background-color": "hsla(260, 48%, 52%, 0.4)" }
  });

  return rendition;
}

async function getNewEpubFile(blob) {
  const { default: epubjs } = await import("epubjs");
  book = epubjs(blob);

  await book.ready;

  const [metadata, cfiArray, coverImage] = await Promise.all([
    book.loaded.metadata,
    book.locations.generate(1650),
    getEpubCoverUrl(book)
  ]);
  const newFile = {
    storedPosition: JSON.stringify(cfiArray),
    coverImage,
    id: uuidv4(),
    name: blob.name,
    type: "epub",
    createdAt: Date.now(),
    scale: getDefaultScale(),
    size: blob.size,
    sizeString: getFileSizeString(blob.size),
    pageNumber: 1,
    pageCount: book.locations.length(),
    viewMode: "single"
  };

  if (metadata.title) {
    newFile.title = metadata.title;
  }

  if (metadata.creator) {
    newFile.author = metadata.creator;
  }
  return newFile;
}

function getDefaultScale() {
  return {
    name: "1",
    currentScale: 1
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

function handleKeyDown(event) {
  if (event.target.nodeName === "INPUT") {
    return;
  }

  if (event.ctrlKey) {
    if (event.key === "+") {
      zoomIn();
      event.preventDefault();
    }
    if (event.key === "-") {
      zoomOut();
      event.preventDefault();
    }
    return;
  }

  if (event.key === "ArrowLeft") {
    previousPage();
  }
  else if (event.key === "ArrowRight") {
    nextPage();
  }
}

export {
  initEpubViewer,
  cleanupEpubViewer,
  setSaveEpubFile,
  getNewEpubFile
};
