import { v4 as uuidv4 } from "uuid";
import { getPdfInstance, pageToDataURL, parsePdfMetadata, scrollToPage, getPageElementBox, getScrollbarWidth, getElementByAttr, getFileSizeString } from "../../utils";
import * as fileService from "../../services/fileService";
import { getSettings, setSettings } from "../../services/settingsService";
import LinkService from "../../services/viewerLinkService";
import { startCounting, stopCounting } from "../../services/statsService";
import { initOutline } from "./outline";

const settings = getSettings();
const defaultScale = 1.3333;
const minScale = 0.333325;
const maxScale = 13.333;
let pdfjs = null;
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
let saveTimeoutId = 0;
let dataToSave = {};
let user = {};

async function initPdfViewer(container, { metadata, blob, save = true }, loggedUser) {
  pdfjs = await import("pdfjs-dist/webpack");
  user = loggedUser;
  pdfElement = container;
  pdfInstance = await getPdfInstance(blob);
  fileMetadata = metadata;
  scale = settings.pdf.scale;
  rotation = metadata.rotation || 0;
  pageNumber = metadata.pageNumber || 1;
  document.body.style.overscrollBehavior = "none";

  ([pageDimensions] = await Promise.all([
    getPageDimensions(pdfInstance, metadata.rotation),
    settings.pdf.viewMode === "multi" ?
      renderEmptyPages(pdfElement, pdfInstance, metadata) :
      renderSingleEmptyPage(pdfElement, pdfInstance, metadata)
  ]));

  const params = {
    scrollLeft: metadata.scrollLeft,
    scrollTop: metadata.scrollTop,
    scale: metadata.scale
  };

  if (metadata.viewMode === settings.pdf.viewMode) {
    params.scrollTop = params.scrollTop / params.scale * scale.currentScale;
    params.scrollLeft = params.scrollLeft / params.scale * scale.currentScale;
  }
  else if (metadata.viewMode === "single" && settings.pdf.viewMode === "multi") {
    const { top } = getPageElementBox(pageNumber, pdfElement.children);

    params.viewMode = settings.pdf.viewMode;
    params.scrollTop = top + (params.scrollTop / params.scale * scale.currentScale);
  }
  else if (metadata.viewMode === "multi" && settings.pdf.viewMode === "single") {
    params.viewMode = settings.pdf.viewMode;
    params.scrollTop = 0;
    params.scrollLeft = 0;
  }

  if (params.scale !== scale.currentScale) {
    params.scale = scale.currentScale;
  }
  window.scrollTo(params.scrollLeft, params.scrollTop);

  initScale(scale);
  initColorInversion();
  initPage();
  initOutline(getOutline, goToDestination);
  setSavePdfFile(save);

  const [singlePageViewElement, multiPageViewElement] = document.getElementById("js-viewer-view-modes").children;

  if (settings.pdf.viewMode === "multi") {
    views = views.length ? views: getPageViews();
    multiPageViewElement.classList.add("active");
    window.addEventListener("scroll", handleScroll);

    registerIntersectionObserver();
  }
  else {
    const media = matchMedia("only screen and (hover: none) and (pointer: coarse)");

    if (media.matches && !settings.keepToolbarVisible) {
      pdfElement.classList.remove("offset");
    }
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

  if (save) {
    if (metadata.status !== "have read") {
      if (metadata.pageCount === 1) {
        params.status = "have read";
      }
      else if (params.status !== "reading") {
        params.status = "reading";
      }
    }
    params.accessedAt = Date.now();

    updateFile(metadata, params);
    fileService.saveCurrentFile(blob);
  }
  startCounting(user);
}

function updateFile(file, data, skipWaiting = false) {
  Object.assign(file, data);
  Object.assign(dataToSave, data);

  clearTimeout(saveTimeoutId);
  saveTimeoutId = setTimeout(() => {
    fileService.updateFile(dataToSave, {
      id: file.id,
      local: file.local,
      userId: user.id
    });
    dataToSave = {};
  }, skipWaiting ? 1 : 10000);
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

function cleanupPdfViewer(reloading) {
  if (reloading) {
    if (pdfElement) {
      pdfElement.innerHTML = "";
    }
    pdfInstance = null;

    stopCounting();
    cleanupScale();
    cleanupViewMode();
    cleanupPageSelection();
    cleanupColorInversion();
  }
  document.body.style.overscrollBehavior = "";
  unregisterIntersectionObserver();

  if (save) {
    updateFile(fileMetadata, dataToSave, true);
  }
  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("scroll", handleSinglePageScroll);
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
  window.removeEventListener("wheel", handleWheel, { passive: false });
  window.removeEventListener("click", handleAnnotationClick);
}

function setSavePdfFile(saveFile) {
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

function initColorInversion() {
  const invertColorsCheckbox = document.getElementById("js-viewer-invert-colors");

  if (settings.pdf.invertColors) {
    document.getElementById("js-viewer").classList.add("invert");
    invertColorsCheckbox.checked = settings.pdf.invertColors;
  }
  invertColorsCheckbox.addEventListener("change", handleColorInversion);
}

function cleanupColorInversion() {
  const element = document.getElementById("js-viewer-invert-colors");

  document.getElementById("js-viewer").classList.remove("invert");

  if (element) {
    element.removeEventListener("change", handleColorInversion);
  }
}

function cleanupScale() {
  const zoomOutElement = document.getElementById("js-viewer-zoom-out");
  const zoomInElement = document.getElementById("js-viewer-zoom-in");

  zoomOutElement.removeEventListener("click", zoomOut);
  zoomInElement.removeEventListener("click", zoomIn);
  document.getElementById("js-viewer-scale-select").removeEventListener("change", handleScaleSelect);
}

function cleanupViewMode() {
  const viewModesElement = document.getElementById("js-viewer-view-modes");

  viewModesElement.querySelector(`[data-mode=${settings.pdf.viewMode}]`).classList.remove("active");
  viewModesElement.removeEventListener("click", setViewMode);
}

function cleanupPageSelection() {
  const previousPageElement = document.getElementById("js-viewer-previous-page");
  const nextPageElement = document.getElementById("js-viewer-next-page");

  previousPageElement.removeEventListener("click", previousPage);
  nextPageElement.removeEventListener("click", nextPage);
}

function handleScroll() {
  if (scrolling) {
    return;
  }
  scrolling = true;

  requestAnimationFrame(() => {
    const { scrollTop, scrollLeft } = document.documentElement;
    const oldPageNumber = pageNumber;
    const newScrollTop = scrollTop < 0 ? 0 : scrollTop;

    pageNumber = getVisiblePageNumber(views, newScrollTop);

    if (save) {
      updateFile(fileMetadata, {
        scrollTop: newScrollTop,
        scrollLeft,
        pageNumber
      });
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

    if (save) {
      updateFile(fileMetadata, {
        scrollTop: scrollTop < 0 ? 0 : scrollTop,
        scrollLeft
      });
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

function handleColorInversion({ target }) {
  settings.pdf.invertColors = target.checked;

  document.getElementById("js-viewer").classList.toggle("invert", target.checked);
  setSettings(settings);
}

function getOutlineItem(item) {
  const linkService = new LinkService(pdfInstance, pdfElement, window.location.href);

  return {
    title: item.title,
    href: linkService.getDestinationHash(item.dest),
    items: item.items.map(getOutlineItem)
  };
}

async function getOutline() {
  const outline = await pdfInstance.getOutline();

  return outline ? outline.map(getOutlineItem) : [];
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

async function getNewPdfFile(file, user) {
  pdfInstance = await getPdfInstance(file);
  const [metadata, coverImage] = await Promise.all([
    pdfInstance.getMetadata(),
    pageToDataURL(pdfInstance)
  ]);
  const params = {};

  if (!user.email) {
    params.local = true;
  }

  return {
    ...parsePdfMetadata(metadata),
    id: uuidv4(),
    name: file.name,
    type: "pdf",
    createdAt: Date.now(),
    size: file.size,
    sizeString: getFileSizeString(file.size),
    pageNumber: 1,
    pageCount: pdfInstance.numPages,
    viewMode: "multi",
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

  if (annotationLayerDiv && settings.pdf.viewMode === "multi") {
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

  if (pageInputElement) {
    pageInputElement.value = pageNumber;
    pageInputElement.style.width = `${pageNumber.toString().length}ch`;
  }
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
  if (settings.pdf.viewMode === "multi") {
    scrollToPage(value, pdfElement.children, { keepToolbarVisible: settings.keepToolbarVisible });
  }
  else {
    pageNumber = value;

    if (save) {
      updateFile(fileMetadata, { pageNumber });
    }
    renderSinglePage(value);
    window.scrollTo(0, 0);

    if (updatePageInput) {
      updatePageInputElement(value);
    }
    updatePageBtnElementState(value);
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
  let scrollTop = 0;
  let scrollLeft = 0;

  scale.name = name;
  scale.currentScale = value;
  scale.displayValue = Math.round(value * 100 / defaultScale);

  if (settings.pdf.viewMode === "multi") {
    const { top } = getPageElementBox(pageNumber, pdfElement.children);

    updatePages(value);
    views = getPageViews();

    scrollTop = views[pageNumber - 1].top - (top / oldScaleValue * value);
    scrollLeft = fileMetadata.scrollLeft / oldScaleValue * value;

    registerIntersectionObserver();
  }
  else {
    renderSinglePage(pageNumber);

    scrollTop = fileMetadata.scrollTop / oldScaleValue * value;
    scrollLeft = fileMetadata.scrollLeft / oldScaleValue * value;
  }
  settings.pdf.scale = scale;

  if (save) {
    updateFile(fileMetadata, { scale: scale.currentScale, scrollTop, scrollLeft });
  }
  updateScaleElement(scale);
  window.scrollTo(scrollLeft, scrollTop);
  setSettings(settings);
}

function getMaxHeight(height) {
  const singlePageViewMode = settings.pdf.viewMode === "single";
  const { keepToolbarVisible } = settings;
  return height - (keepToolbarVisible || pageNumber === 1 || singlePageViewMode ? 56 : 16);
}

async function handleScaleSelect({ target }) {
  const { value } = target;
  let newScale = 0;

  if (value === "fit-width") {
    const { offsetWidth, scrollHeight, offsetHeight } = document.documentElement;
    const { width, height } = await getPageViewport(pdfInstance, { pageNumber, rotation }, true);
    const maxHeight = getMaxHeight(offsetHeight);
    let maxWidth = offsetWidth - 16;
    let scrollbarWidth = 0;
    newScale = maxWidth / width;

    if (Math.round(newScale * width) >= maxWidth) {
      const newPageHeight = Math.round(newScale * height);

      if (scrollHeight > offsetHeight) {
        if (settings.pdf.viewMode === "multi" && fileMetadata.pageCount * newPageHeight > offsetHeight) {
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
    const { width, height } = await getPageViewport(pdfInstance, { pageNumber, rotation }, true);
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

  if (mode === settings.pdf.viewMode) {
    return;
  }
  const [singlePageViewElement, multiPageViewElement] = event.currentTarget.children;

  singlePageViewElement.classList.toggle("active");
  multiPageViewElement.classList.toggle("active");

  pdfElement.innerHTML = "";
  settings.pdf.viewMode = mode;

  if (save) {
    updateFile(fileMetadata, { viewMode: mode });
  }

  if (mode === "multi") {
    await renderEmptyPages(pdfElement, pdfInstance, fileMetadata);
    views = getPageViews();
    scrollToPage(pageNumber, pdfElement.children, {
      keepToolbarVisible: settings.keepToolbarVisible,
      scrollLeft: 0
    });
    registerIntersectionObserver();
    hideSinglePageNavBtn();
    pdfElement.classList.add("offset");

    window.addEventListener("scroll", handleScroll);
    window.removeEventListener("scroll", handleSinglePageScroll);
    window.removeEventListener("click", handleAnnotationClick);
  }
  else {
    const media = matchMedia("only screen and (hover: none) and (pointer: coarse)");

    if (media.matches && !settings.keepToolbarVisible) {
      pdfElement.classList.remove("offset");
    }
    unregisterIntersectionObserver();
    await renderSingleEmptyPage(pdfElement, pdfInstance, fileMetadata);
    renderSinglePage(pageNumber);
    window.scrollTo(0, 0);
    showSinglePageNavBtn();

    window.addEventListener("scroll", handleSinglePageScroll);
    window.addEventListener("click", handleAnnotationClick);
    window.removeEventListener("scroll", handleScroll);
  }
  setSettings(settings);
}

function rotatePages() {
  const nextRotation = rotation + 90;

  rotation = nextRotation === 360 ? 0 : nextRotation;
  swapDimensions = !swapDimensions;

  if (save) {
    updateFile(fileMetadata, { rotation });
  }

  if (settings.pdf.viewMode === "multi") {
    updatePages(scale.currentScale);
    views = getPageViews();
    registerIntersectionObserver();
    scrollToPage(pageNumber, pdfElement.children, { keepToolbarVisible: settings.keepToolbarVisible });
  }
  else {
    renderSinglePage(pageNumber);
    window.scrollTo(0, 0);
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

async function getPageViewport(pdf, { pageNumber, rotation = 0 }, useDefaultScale = false) {
  const page = await pdf.getPage(pageNumber);
  return page.getViewport({ scale: useDefaultScale ? 1 : scale.currentScale, rotation: rotation + page.rotate });
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
    const { width, height } = await getPageViewport(pdf, { pageNumber: i + 1, rotation }, true);

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

export {
  initPdfViewer,
  cleanupPdfViewer,
  getNewPdfFile,
  setSavePdfFile
};
