import { v4 as uuidv4 } from "uuid";
import { getElementByAttr, getEpubCoverUrl, getFileSizeString } from "../../utils";
import { saveFile } from "../../services/fileIDBService";
import { saveCurrentFile } from "../../services/currentFileIDBService";

const minScale = 0.333325;
const maxScale = 13.333;
const outline = {};
let book = null;
let rendition = null;
let fileMetadata = null;
let scale = null;
let epubElement = null;
let scrollTimeout = 0;
let save = true;
let dropdownId = "";
let hideDropdown = null;

async function initEpubViewer(container, { metadata, blob, save = true }) {
  const { default: epubjs } = await import("epubjs");
  book = epubjs(blob);
  fileMetadata = metadata;
  scale = metadata.scale || getDefaultScale();
  epubElement = container;
  rendition = getRendition(metadata.viewMode);

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

  initScale(scale);
  initPage(metadata.pageNumber, metadata.pageCount);
  initOutline();


  const [singlePageViewElement, spreadPageViewElement] = document.getElementById("js-viewer-view-modes").children;

  if (metadata.viewMode === "single") {
    singlePageViewElement.classList.add("active");
  }
  else {
    spreadPageViewElement.classList.add("active");
  }
  document.getElementById("js-viewer-view-modes").addEventListener("click", setViewMode);
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
}

function handleDropdownVisibility({ detail }) {
  dropdownId = detail.id;
  hideDropdown = detail.hide;
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

async function initOutline() {
  const navigation = await book.loaded.navigation;
  const hasOutline = navigation.length > 0;
  const container = document.getElementById("js-viewer-outline");
  const toggleBtn = document.getElementById("js-viewer-outline-toggle-btn");

  container.innerHTML = "";
  container.classList.remove("has-inner-tree", "visible");
  container.removeEventListener("click", handleOutlineClick);

  toggleBtn.classList.toggle("visible", hasOutline);

  if (hasOutline) {
    toggleBtn.addEventListener("click", toggleOutline);
  }
  outline.rendered = false;
  outline.visible = false;
}

async function toggleOutline() {
  const container = document.getElementById("js-viewer-outline");

  outline.visible = !outline.visible;

  if (!outline.rendered) {
    renderOutline(book.navigation.toc, container);
    container.addEventListener("click", handleOutlineClick);
    outline.rendered = true;
  }
  container.classList.toggle("visible", outline.visible);
}

function handleOutlineClick(event) {
  const { nodeName } = event.target;

  if (nodeName === "A") {
    const href = event.target.href.split(/viewer\/.*?\//g)[1];

    rendition.display(href);
    event.preventDefault();
  }
  else if (nodeName === "BUTTON") {
    event.target.classList.toggle("rotated");
    event.target.parentElement.nextElementSibling.classList.toggle("visible");
  }
}

function renderOutline(items, container) {
  const fragment = new DocumentFragment();

  for (const item of items) {
    const div = document.createElement("div");
    const a = document.createElement("a");

    div.classList.add("viewer-outline-item");
    a.classList.add("viewer-outline-link");
    a.textContent = item.label;
    a.href = `${window.location.href}/${item.href}`;

    if (item.subitems.length) {
      const div2 = document.createElement("div");
      const button = document.createElement("button");

      button.innerHTML = "&#x25BE";
      button.classList.add("btn", "icon-btn", "viewer-outline-tree-toggle-btn");

      div2.appendChild(button);
      div2.appendChild(a);
      div.appendChild(div2);
      container.classList.add("has-inner-tree");
    }
    else {
      div.appendChild(a);
    }

    if (item.subitems.length) {
      const div2 = document.createElement("div");

      div2.classList.add("viewer-outline-inner-tree");
      renderOutline(item.subitems, div2);
      div.appendChild(div2);
    }
    fragment.appendChild(div);
  }
  container.appendChild(fragment);
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
  rendition.themes.default({ "body": { "font-size": `${value * 100}% !important` }});

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

  rendition.themes.default({
    "body": { "font-size": `${scale.currentScale * 100}% !important`},
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
    pageCount: book.locations.length()
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
