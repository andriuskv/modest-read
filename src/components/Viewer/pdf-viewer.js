import * as pdfjs from "pdfjs-dist/webpack";
import { v4 as uuidv4 } from "uuid";
import { getPdfInstance, pageToDataURL, parseMetadata, scrollToPage, getPageElementBox, getScrollbarWidth, getElementByAttr } from "../../utils";
import { saveFile } from "../../services/fileIDBService";
import { saveCurrentFile } from "../../services/currentFileIDBService";
import { getSettings, setSetting } from "../../services/settingsService";
import LinkService from "../../services/viewerLinkService";

const settings = getSettings();
const outline = {};
const defaultScale = 1.3333;
const minScale = 0.333325;
const maxScale = 13.333;
let pdfElement = null;
let pdfInstance = null;
let fileMetadata = null;
let views = [];
let pageDimensions = [];
let observer = null;
let scale = null;
let rotation = 0;
let pageNumber = 1;
let save = true;
let swapDimensions = false;
let ctrlPressed = false;
let scrolling = false;
let scrollTimeout = false;

async function initViewer(container, { metadata, blob, save }) {
  pdfElement = container;
  pdfInstance = await getPdfInstance(blob, pdfjs);
  fileMetadata = metadata;
  scale = metadata.scale || getDefaultScale();
  rotation = metadata.rotation || 0;
  pageNumber = metadata.pageNumber || 1;
  document.body.style.overscrollBehavior = "none";

  const [dimensions, hasOutline] = await Promise.all([
    getPageDimensions(pdfInstance, metadata.rotation),
    pdfInstance.getOutline(),
    settings.viewMode === "multi" ?
      renderEmptyPages(pdfElement, pdfInstance, metadata) :
      renderSingleEmptyPage(pdfElement, pdfInstance, metadata)
  ]);
  pageDimensions = dimensions;

  initScale(scale);
  initPage();
  initOutline(hasOutline);

  const [multiPageViewElement, singlePageViewElement] = document.getElementById("js-viewer-view-modes").children;

  if (settings.viewMode === "multi") {
    views = getPageViews();
    multiPageViewElement.classList.add("active");
    window.addEventListener("scroll", handleScroll);

    registerIntersectionObserver();
  }
  else {
    renderSinglePage(pageNumber);
    showSinglePageNavBtn();

    singlePageViewElement.classList.add("active");

    window.addEventListener("scroll", handleSinglePageScroll);
    window.addEventListener("click", handleAnnotationClick);
  }
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("wheel", handleWheel, { passive: false });

  document.getElementById("js-viewer-rotate-btn").addEventListener("click", rotatePages);
  document.getElementById("js-viewer-view-modes").addEventListener("click", setViewMode);

  window.scrollTo(metadata.scrollLeft, metadata.scrollTop);

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

function showSinglePageNavBtn() {
  const previousPageElement = document.getElementById("js-viewer-nav-previous-btn");
  const nextPageElement = document.getElementById("js-viewer-nav-next-btn");

  previousPageElement.classList.add("visible");
  nextPageElement.classList.add("visible");
  previousPageElement.addEventListener("click", previousPage);
  nextPageElement.addEventListener("click", nextPage);
}

function hideSinglePageNavBtn() {
  const previousPageElement = document.getElementById("js-viewer-nav-previous-btn");
  const nextPageElement = document.getElementById("js-viewer-nav-next-btn");

  previousPageElement.classList.remove("visible");
  nextPageElement.classList.remove("visible");
  previousPageElement.removeEventListener("click", previousPage);
  nextPageElement.removeEventListener("click", nextPage);
}

function cleanupViewer() {
  unregisterIntersectionObserver();

  if (pdfElement) {
    pdfElement.innerHTML = "";
  }
  pdfInstance = null;
  document.body.style.overscrollBehavior = "";
  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("scroll", handleSinglePageScroll);
}

function reloadViewer(container, file) {
  cleanupViewer();
  initViewer(container, file);
}

function setSaveViewerFile(saveFile) {
  save = saveFile;
}

function initScale(scale) {
  const zoomOutElement = document.getElementById("js-viewer-zoom-out");
  const zoomInElement = document.getElementById("js-viewer-zoom-in");

  updateScaleElement(scale);

  zoomOutElement.addEventListener("click", zoomOut);
  zoomInElement.addEventListener("click", zoomIn);
  document.getElementById("js-viewer-scale-select").addEventListener("change", handleScaleSelect);
}

function initPage() {
  const previousPageElement = document.getElementById("js-viewer-previous-page");
  const nextPageElement = document.getElementById("js-viewer-next-page");
  const pageInputContainerElement = document.getElementById("js-viewer-page-input-container");
  const pageInputElement = document.getElementById("js-viewer-page-input");

  pageInputContainerElement.lastElementChild.textContent = `of ${fileMetadata.pageCount}`;

  updatePageInputElement(pageNumber);
  updatePageBtnElementState(pageNumber);

  pageInputContainerElement.addEventListener("click", handlePageInputContainerClick);

  previousPageElement.addEventListener("click", previousPage);
  nextPageElement.addEventListener("click", nextPage);

  pageInputElement.addEventListener("focus", handlePageInputFocus);
  pageInputElement.addEventListener("blur", handlePageInputBlur);
  pageInputElement.addEventListener("keydown", handlePageInputKeydown);
}

function initOutline(hasOutline) {
  const container = document.getElementById("js-viewer-outline");
  const toggleBtn = document.getElementById("js-viewer-outline-toggle-btn");

  container.innerHTML = "";
  container.classList.remove("visible");
  container.removeEventListener("click", handleOutlineClick);

  toggleBtn.classList.toggle("visible", !!hasOutline);
  toggleBtn.addEventListener("click", toggleOutline);

  outline.rendered = false;
  outline.visible = false;
}

function handleScroll() {
  if (scrolling) {
    return;
  }
  scrolling = true;

  requestAnimationFrame(() => {
    const { scrollTop, scrollLeft } = document.documentElement;
    const oldPageNumber = pageNumber;

    fileMetadata.scrollTop = scrollTop < 0 ? 0 : scrollTop;
    fileMetadata.scrollLeft = scrollLeft;
    pageNumber = getVisiblePageNumber(views, fileMetadata.scrollTop);
    fileMetadata.pageNumber = pageNumber;

    if (save) {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        saveFile(fileMetadata);
      }, 1000);
    }

    if (pageNumber !== oldPageNumber) {
      updatePageInputElement(pageNumber);
      updatePageBtnElementState(pageNumber);
    }
    scrolling = false;
  });
}

function handleSinglePageScroll() {
  if (scrolling) {
    return;
  }
  scrolling = true;

  requestAnimationFrame(() => {
    const { scrollTop, scrollLeft } = document.documentElement;

    fileMetadata.scrollTop = scrollTop < 0 ? 0 : scrollTop;
    fileMetadata.scrollLeft = scrollLeft;

    if (save) {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        saveFile(fileMetadata);
      }, 1000);
    }
    scrolling = false;
  });
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
  const { pageNumber, pageCount } = fileMetadata;
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
  target.style.width = `${number.toString().length}ch`;

  setPage(number, false);
}

function handlePageInputKeydown(event) {
  if (event.key === "Enter") {
    event.target.blur();
  }
}

function handleAnnotationClick({ target }) {
  if (target.nodeName === "A" && target.classList.contains("internalLink")) {
    goToDestination(target.href);
  }
}

function handleKeyDown(event) {
  if (event.target.nodeName === "INPUT") {
    return;
  }
  ctrlPressed = event.ctrlKey;

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
  const { scrollWidth, offsetWidth } = document.documentElement;

  if (scrollWidth <= offsetWidth) {
    if (event.key === "ArrowLeft") {
      setPage(pageNumber - 1);
    }
    else if (event.key === "ArrowRight") {
      setPage(pageNumber + 1);
    }
  }
}

function handleKeyUp(event) {
  ctrlPressed = event.ctrlKey;
}

function handleWheel(event) {
  if (ctrlPressed) {
    event.preventDefault();

    if (event.wheelDelta > 0) {
      zoomIn();
    }
    else {
      zoomOut();
    }
  }
}

async function toggleOutline() {
  const container = document.getElementById("js-viewer-outline");

  outline.visible = !outline.visible;

  if (!outline.rendered) {
    const items = await pdfInstance.getOutline();

    if (items) {
      renderOutline(items, container);
      container.addEventListener("click", handleOutlineClick);
    }
    outline.rendered = true;
  }
  container.classList.toggle("visible", outline.visible);
}

function renderOutline(items, container) {
  const fragment = new DocumentFragment();
  const linkService = new LinkService(pdfInstance, pdfElement, window.location.href);

  for (const item of items) {
    const div = document.createElement("div");
    const a = document.createElement("a");

    div.classList.add("viewer-outline-item");
    a.classList.add("viewer-outline-link");
    a.textContent = item.title;
    a.href = linkService.getDestinationHash(item.dest);

    if (item.items.length) {
      const div2 = document.createElement("div");
      const button = document.createElement("button");

      button.innerHTML = "&#x25BE";
      button.classList.add("btn", "icon-btn", "viewer-outline-tree-toggle-btn");

      div2.appendChild(button);
      div2.appendChild(a);
      div.appendChild(div2);
    }
    else {
      div.appendChild(a);
    }

    if (item.items.length) {
      const div2 = document.createElement("div");

      div2.classList.add("viewer-outline-inner-tree");
      renderOutline(item.items, div2);
      div.appendChild(div2);
    }
    fragment.appendChild(div);
  }
  container.appendChild(fragment);
}

function handleOutlineClick(event) {
  const { nodeName } = event.target;

  if (nodeName === "A") {
    event.preventDefault();
    goToDestination(event.target.href);
  }
  else if (nodeName === "BUTTON") {
    event.target.classList.toggle("rotated");
    event.target.parentElement.nextElementSibling.classList.toggle("visible");
  }
}

function getVisiblePageNumber(views, top) {
  for (let i = 0; i < views.length - 1; i += 1) {
    const view = views[i];
    const view2 = views[i + 1];
    const offset = view.top + (view.height / 2);
    const offset2 = view2.top + (view2.height / 2);

    if (top >= offset && top <= offset2) {
      return i + 2;
    }
  }
  return 1;
}

async function goToDestination(link) {
  const url = new URL(link);

  if (url.origin !== window.location.origin) {
    return;
  }
  const arr = url.hash.split("#");
  const data = unescape(arr[arr.length - 1]);
  let dest = "";

  try {
    dest = JSON.parse(data);
  } catch {
    dest = await pdfInstance.getDestination(data);
  }
  const index = await pdfInstance.getPageIndex(dest[0]);

  setPage(index + 1);
}

async function getNewFile(file) {
  pdfInstance = await getPdfInstance(file, pdfjs);
  const [metadata, coverImage] = await Promise.all([pdfInstance.getMetadata(), pageToDataURL(pdfInstance)]);

  return {
    ...parseMetadata(metadata),
    id: uuidv4(),
    name: file.name,
    createdAt: Date.now(),
    scale: getDefaultScale(),
    pageCount: pdfInstance.numPages,
    coverImage
  };
}

function registerIntersectionObserver() {
  if (observer) {
    observer.disconnect();
  }
  const height = views[pageNumber - 1].height / 2;
  observer = new IntersectionObserver(callback, { rootMargin: `${height}px 0px` });
  Array.from(pdfElement.children).forEach(element => {
    observer.observe(element);
  });
}

function unregisterIntersectionObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

function callback(entries) {
  entries.forEach(({ isIntersecting, target }) => {
    if (!isIntersecting || (target.hasAttribute("data-loaded") && !target.hasAttribute("data-rerender-needed"))) {
      return;
    }
    target.setAttribute("data-loaded", "true");
    renderPageContent(target);
  });
}

async function renderPageContent(container) {
  const number = parseInt(container.getAttribute("data-page-number"), 10);
  const { width, height } = getScaledPageDimensions(number - 1, scale.currentScale);
  const canvas = document.createElement("canvas");
  let textLayerDiv = null;
  let oldCanvas = null;

  canvas.classList.add("viewer-page-canvas");

  if (container.hasAttribute("data-rerender-needed")) {
    ([oldCanvas, textLayerDiv] = container.children);
    textLayerDiv.innerHTML = "";

    container.removeAttribute("data-rerender-needed");
  }
  else {
    textLayerDiv = document.createElement("div");
    textLayerDiv.classList.add("viewer-page-text");

    container.appendChild(canvas);
    container.appendChild(textLayerDiv);
  }
  const page = await pdfInstance.getPage(number);
  const viewport = page.getViewport({
    scale: scale.currentScale,
    rotation: (rotation + page.rotate) % 360
  });

  canvas.width = width;
  canvas.height = height;
  textLayerDiv.style.width = `${width}px`;
  textLayerDiv.style.height = `${height}px`;

  await page.render({
    canvasContext: canvas.getContext("2d"),
    enableWebGL: true,
    viewport
  }).promise;

  requestAnimationFrame(async () => {
    pdfjs.renderTextLayer({
      textContent: await page.getTextContent(),
      container: textLayerDiv,
      viewport,
      textDivs: []
    });

    renderAnnotations(viewport, page, container);
  });

  if (oldCanvas) {
    container.replaceChild(canvas, oldCanvas);
  }
}

async function renderAnnotations(viewport, page, container) {
  const annotations = await page.getAnnotations();
  const annotationLayerDiv = container.children[2];

  if (!annotations.length) {
    if (annotationLayerDiv) {
      annotationLayerDiv.remove();
    }
    return;
  }
  const params = {
    page,
    annotations,
    viewport: viewport.clone({ dontFlip: true }),
    div: annotationLayerDiv,
    linkService: new LinkService(pdfInstance, pdfElement, window.location.href)
  };

  if (annotationLayerDiv && settings.viewMode === "multi") {
    pdfjs.AnnotationLayer.update(params);
  }
  else {
    const div = document.createElement("div");
    div.className = "viewer-annotation-layer";
    container.appendChild(div);
    params.div = div;
    pdfjs.AnnotationLayer.render(params);

    if (annotationLayerDiv) {
      annotationLayerDiv.remove();
    }
  }
}

function updatePages(scaleValue) {
  for (const [index, element] of Object.entries(pdfElement.children)) {
    const { width, height } = getScaledPageDimensions(index, scaleValue);

    element.style.width = `${width}px`;
    element.style.height = `${height}px`;

    if (element.hasAttribute("data-loaded")) {
      const canvas = element.firstElementChild;
      const { width: canvasWidth } = canvas;

      if (width === canvasWidth) {
        canvas.style.width = "";
        canvas.style.height = "";
        element.removeAttribute("data-rerender-needed");
      }
      else {
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        element.setAttribute("data-rerender-needed", true);
      }
    }
  }
}

function renderSinglePage(pageNumber) {
  updatePageInSingleMode(pageNumber);
  renderPageContent(pdfElement.firstElementChild);
  pdfElement.firstElementChild.setAttribute("data-loaded", "true");
}

function updatePageInSingleMode(pageNumber) {
  const { width, height } = getScaledPageDimensions(pageNumber - 1, scale.currentScale);
  const element = pdfElement.firstElementChild;

  element.style.width = `${width}px`;
  element.style.height = `${height}px`;

  element.setAttribute("data-page-number", pageNumber);

  if (element.hasAttribute("data-loaded")) {
    const canvas = element.firstElementChild;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    element.setAttribute("data-rerender-needed", true);
  }
}

function updatePageInputElement(pageNumber) {
  const pageInputElement = document.getElementById("js-viewer-page-input");

  pageInputElement.value = pageNumber;
  pageInputElement.style.width = `${pageNumber.toString().length}ch`;
}

function updatePageBtnElementState(pageNumber) {
  const previousPageElement = document.getElementById("js-viewer-previous-page");
  const nextPageElement = document.getElementById("js-viewer-next-page");

  if (pageNumber === 1) {
    previousPageElement.disabled = true;
  }
  else if (pageNumber === fileMetadata.pageCount) {
    nextPageElement.disabled = true;
  }
  else {
    previousPageElement.disabled = false;
    nextPageElement.disabled = false;
  }
}

function setPage(value, updatePageInput = true) {
  if (settings.viewMode === "multi") {
    scrollToPage(value, pdfElement.children, { keepToolbarVisible: settings.keepToolbarVisible });
  }
  else {
    pageNumber = value;
    fileMetadata.pageNumber = pageNumber;

    renderSinglePage(value);
    window.scrollTo(0, 0);

    if (updatePageInput) {
      updatePageInputElement(value);
    }
    updatePageBtnElementState(value);

    if (save) {
      saveFile(fileMetadata);
    }
  }
}

function previousPage() {
  setPage(pageNumber - 1);
}

function nextPage() {
  setPage(pageNumber + 1);
}

function zoomIn() {
  setScale(Math.min(scale.currentScale * 1.1, maxScale));
}

function zoomOut() {
  setScale(Math.max(scale.currentScale / 1.1, minScale));
}

function updateScaleElement(scale) {
  const element = document.getElementById("js-viewer-scale-select");

  element.value = scale.name;
  element.firstElementChild.textContent = `${scale.displayValue}%`;
}

function setScale(value, name = "custom") {
  const oldScaleValue = scale.currentScale;

  scale.name = name;
  scale.currentScale = value;
  scale.displayValue = Math.round(value * 100 / defaultScale);

  fileMetadata.scale = scale;

  if (settings.viewMode === "multi") {
    const { top } = getPageElementBox(pageNumber, pdfElement.children);

    updatePages(value);
    views = getPageViews();

    fileMetadata.scrollTop = views[pageNumber - 1].top - (top / oldScaleValue * value);
    fileMetadata.scrollLeft = fileMetadata.scrollLeft / oldScaleValue * value;

    registerIntersectionObserver();
  }
  else {
    renderSinglePage(pageNumber);

    fileMetadata.scrollTop = fileMetadata.scrollTop / oldScaleValue * value;
    fileMetadata.scrollLeft = fileMetadata.scrollLeft / oldScaleValue * value;
  }
  updateScaleElement(scale);
  window.scrollTo(fileMetadata.scrollLeft, fileMetadata.scrollTop);

  if (save) {
    saveFile(fileMetadata);
  }
}

function getMaxHeight(height) {
  const singlePageViewMode = settings.viewMode === "single";
  const { keepToolbarVisible } = settings;
  return height - (keepToolbarVisible || pageNumber === 1 || singlePageViewMode ? 56 : 16);
}

async function handleScaleSelect({ target }) {
  const { value } = target;
  let newScale = 0;

  if (value === "fit-width") {
    const { offsetWidth, scrollHeight, offsetHeight } = document.documentElement;
    const { width, height } = await getPageViewport(pdfInstance, { pageNumber, rotation });
    const maxHeight = getMaxHeight(offsetHeight);
    let maxWidth = offsetWidth - 16;
    let scrollbarWidth = 0;
    newScale = maxWidth / width;

    if (Math.round(newScale * width) >= maxWidth) {
      const newPageHeight = Math.round(newScale * height);

      if (scrollHeight > offsetHeight) {
        if (settings.viewMode === "multi" && fileMetadata.pageCount * newPageHeight > offsetHeight) {
          scrollbarWidth = 0;
        }
        else if (newPageHeight < maxHeight) {
          scrollbarWidth = getScrollbarWidth();
        }
      }
      else if (newPageHeight > maxHeight) {
        scrollbarWidth = -getScrollbarWidth();
      }
    }
    maxWidth += scrollbarWidth;
    newScale = maxWidth / width;

  }
  else if (value === "fit-page") {
    const { scrollWidth, offsetWidth, offsetHeight } = document.documentElement;
    const { width, height } = await getPageViewport(pdfInstance, { pageNumber, rotation });
    const maxWidth = offsetWidth - 16;
    let maxHeight = getMaxHeight(offsetHeight);
    let scrollbarWidth = 0;
    newScale = maxHeight / height;

    if (Math.round(newScale * height) >= maxHeight) {
      const newPageWidth = Math.round(newScale * width);

      if (scrollWidth > offsetWidth) {
        if (newPageWidth < maxWidth) {
          scrollbarWidth = getScrollbarWidth();
        }
      }
      else if (newPageWidth > maxWidth) {
        scrollbarWidth = -getScrollbarWidth();
      }
    }
    maxHeight += scrollbarWidth;
    newScale = maxHeight / height;
  }
  else {
    newScale = defaultScale * value;
  }
  setScale(newScale, value);
}

async function setViewMode(event) {
  const element = getElementByAttr("data-mode", event.target, event.currentTarget);

  if (!element) {
    return;
  }
  const { attrValue: mode } = element;

  if (mode === settings.viewMode) {
    return;
  }
  const [multiPageViewElement, singlePageViewElement] = event.currentTarget.children;

  multiPageViewElement.classList.toggle("active");
  singlePageViewElement.classList.toggle("active");

  settings.viewMode = mode;
  pdfElement.innerHTML = "";

  if (mode === "multi") {
    await renderEmptyPages(pdfElement, pdfInstance, fileMetadata);
    views = getPageViews();
    scrollToPage(pageNumber, pdfElement.children, {
      keepToolbarVisible: settings.keepToolbarVisible,
      scrollLeft: 0
    });
    registerIntersectionObserver();
    hideSinglePageNavBtn();

    window.addEventListener("scroll", handleScroll);
    window.removeEventListener("scroll", handleSinglePageScroll);
    window.removeEventListener("click", handleAnnotationClick);
  }
  else {
    unregisterIntersectionObserver();
    await renderSingleEmptyPage(pdfElement, pdfInstance, fileMetadata);
    renderSinglePage(pageNumber);
    window.scrollTo(0, 0);
    showSinglePageNavBtn();

    window.addEventListener("scroll", handleSinglePageScroll);
    window.addEventListener("click", handleAnnotationClick);
    window.removeEventListener("scroll", handleScroll);
  }
  setSetting("viewMode", mode);
}

function rotatePages() {
  const nextRotation = rotation + 90;

  rotation = nextRotation === 360 ? 0 : nextRotation;
  fileMetadata.rotation = rotation;
  swapDimensions = !swapDimensions;

  if (settings.viewMode === "multi") {
    updatePages(scale.currentScale);
    views = getPageViews();
    registerIntersectionObserver();
    scrollToPage(pageNumber, pdfElement.children, { keepToolbarVisible: settings.keepToolbarVisible });
  }
  else {
    renderSinglePage(pageNumber);
    window.scrollTo(0, 0);
  }

  if (save) {
    saveFile(fileMetadata);
  }
}

function getPageViews() {
  return Array.from(pdfElement.children).map(element => {
    return {
      top: element.offsetTop,
      left: element.offsetLeft,
      width: element.offsetWidth,
      height: element.offsetHeight
    };
  });
}

function getScaledPageDimensions(index, scale) {
  const pageDimension = pageDimensions[index];
  let width = Math.floor(pageDimension.width * scale);
  let height = Math.floor(pageDimension.height * scale);

  if (swapDimensions) {
    ([width, height] = [height, width]);
  }
  return { width, height };
}

async function getPageViewport(pdf, { pageNumber, scale = { currentScale: 1 }, rotation = 0 }) {
  const page = await pdf.getPage(pageNumber);
  return page.getViewport({ scale: scale.currentScale, rotation });
}

async function getPageDiv(pdf, file) {
  const { width, height } = await getPageViewport(pdf, file);
  const div = document.createElement("div");

  div.style.width = `${Math.floor(width)}px`;
  div.style.height = `${Math.floor(height)}px`;

  div.setAttribute("data-page-number", file.pageNumber);
  div.classList.add("viewer-page");
  return div;
}

async function getPageDimensions(pdf, rotation) {
  const dimensions = [];

  for (let i = 0; i < pdf.numPages; i += 1) {
    const { width, height } = await getPageViewport(pdf, { pageNumber: i + 1, rotation });

    dimensions.push({ width, height });
  }
  return dimensions;
}

async function renderSingleEmptyPage(pdfElement, pdfInstance, file) {
  const div = await getPageDiv(pdfInstance, file);

  pdfElement.appendChild(div);
}

async function renderEmptyPage(pageNumber, file, fragmenet, pdf) {
  const div = await getPageDiv(pdf, { ...file, pageNumber });

  fragmenet.appendChild(div);
}

async function renderEmptyPages(pdfElement, pdfInstance, file) {
  const fragment = new DocumentFragment();
  const promises = [];

  for (let i = 0; i < pdfInstance.numPages; i += 1) {
    promises.push(renderEmptyPage(i + 1, file, fragment, pdfInstance));
  }
  await Promise.all(promises);
  pdfElement.appendChild(fragment);
}

function getDefaultScale() {
  return {
    name: "1",
    currentScale: defaultScale
  };
}

export {
  initViewer,
  cleanupViewer,
  reloadViewer,
  getNewFile,
  setSaveViewerFile,
  previousPage,
  nextPage
};
