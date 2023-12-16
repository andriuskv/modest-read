import { v4 as uuidv4 } from "uuid";
import { dispatchCustomEvent, getPdfInstance, pageToDataURL, parsePdfMetadata, scrollToPage, getPageElementBox, getScrollbarWidth, getElementByAttr, getFileSizeString } from "utils";
import * as fileService from "services/fileService";
import { getSettings, setSettings } from "services/settingsService";
import LinkService from "services/viewerLinkService";
import { startCounting, stopCounting } from "services/statsService";
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
let swapDimensions = false;
let ctrlPressed = false;
let scrolling = false;
let saveTimeoutId = 0;
let dataToSave = {};
let user = {};
let mouseDownStartPos = null;
let cleanupController = null;
let annotationLayer = null;
let zooming = false;
let zoomTimeoutId = 0;

async function initPdfViewer(container, { metadata, blob }, loggedUser) {
  pdfjs = await import("pdfjs-dist/webpack.mjs");
  user = loggedUser;
  pdfElement = container;
  pdfInstance = await getPdfInstance(blob);
  fileMetadata = metadata;
  scale = settings.pdf.scale || getInitialScale();
  rotation = metadata.rotation || 0;
  pageNumber = metadata.pageNumber || 1;
  cleanupController = new AbortController();
  document.body.style.overscrollBehavior = "none";

  ([pageDimensions] = await Promise.all([
    getPageDimensions(pdfInstance, metadata.rotation),
    settings.pdf.viewMode === "multi" ?
      renderEmptyPages(pdfElement, pdfInstance, metadata) :
      renderSingleEmptyPage(pdfElement, pdfInstance, metadata)
  ]));

  await initScale(scale);

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

  initColorInversion();
  initPage();
  initOutline(getOutline, goToDestination);

  const [singlePageViewElement, multiPageViewElement] = document.getElementById("js-viewer-view-modes").children;

  if (settings.pdf.viewMode === "multi") {
    views = views.length ? views: getPageViews();
    multiPageViewElement.classList.add("active");
    window.addEventListener("scroll", handleScroll);

    registerIntersectionObserver();
  }
  else {
    renderSinglePage(pageNumber);

    singlePageViewElement.classList.add("active");

    window.addEventListener("scroll", handleSinglePageScroll);
    window.addEventListener("click", handleAnnotationClick);
  }
  container.addEventListener("mousedown", handleMouseDownOnRendition);
  container.addEventListener("click", handleNavigationAreaClick);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("wheel", handleWheel, { passive: false });

  document.getElementById("js-viewer-rotate-btn").addEventListener("click", rotatePages);
  document.getElementById("js-viewer-view-modes").addEventListener("click", setViewMode);

  params.accessedAt = Date.now();

  updateFile(metadata, params, true);
  startCounting(user);
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

function cleanupPdfViewer(reloading) {
  if (reloading) {
    if (pdfElement) {
      pdfElement.innerHTML = "";
    }
    pdfInstance = null;
    annotationLayer = null;

    stopCounting();
    clearTimeout(saveTimeoutId);
    cleanupScale();
    cleanupViewMode();
    cleanupPageSelection();
    cleanupColorInversion();
  }
  document.body.style.overscrollBehavior = "";
  pdfElement.style.setProperty("--scale-factor", "");
  unregisterIntersectionObserver();
  updateFile(fileMetadata, dataToSave, true);

  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("scroll", handleSinglePageScroll);
  document.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("keyup", handleKeyUp);
  document.removeEventListener("wheel", handleWheel, { passive: false });
  window.removeEventListener("click", handleAnnotationClick);
  pdfElement.removeEventListener("click", handleNavigationAreaClick);
  pdfElement.removeEventListener("mousedown", handleMouseDownOnRendition);
}

async function initScale(scale) {
  if (scale.name === "custom") {
    pdfElement.style.setProperty("--scale-factor", scale.currentScale);
  }
  else {
    const scaleValue = scale.currentScale ?? await getSelectedScale(scale.name);

    pdfElement.style.setProperty("--scale-factor", scaleValue);
  }
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
  cleanupController.abort();
  cleanupController = null;
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

    updateFile(fileMetadata, {
      scrollTop: newScrollTop,
      scrollLeft,
      pageNumber
    });

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

    updateFile(fileMetadata, {
      scrollTop: scrollTop < 0 ? 0 : scrollTop,
      scrollLeft
    });

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
  if (target.nodeName === "A" && target.href) {
    goToDestination(target.href);
  }
}

function handleNavigationAreaClick(event) {
  if (settings.navigationAreasDisabled) {
    return;
  }

  if (event.target.nodeName === "A" && event.target.href) {
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

function handleKeyDown(event) {
  if (event.target.nodeName === "INPUT") {
    return;
  }
  ctrlPressed = event.ctrlKey;

  if (event.ctrlKey) {
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomIn();
    }
    if (event.key === "-") {
      event.preventDefault();
      zoomOut();
    }
    return;
  }
  const { scrollWidth, offsetWidth } = document.documentElement;

  if (scrollWidth <= offsetWidth) {
    if (event.key === "ArrowLeft") {
      previousPage();
    }
    else if (event.key === "ArrowRight") {
      nextPage();
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
    ...params,
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

  for (const element of pdfElement.children) {
    observer.observe(element);
  }
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

  requestAnimationFrame(() => {
    pdfjs.renderTextLayer({
      textContentSource: page.streamTextContent(),
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
  if (annotationLayerDiv && annotationLayer && settings.pdf.viewMode === "multi") {
    annotationLayer.update({ viewport: viewport.clone({ dontFlip: true }) });
  }
  else {
    const div = document.createElement("div");
    div.className = "viewer-annotation-layer";
    container.appendChild(div);

    annotationLayer = new pdfjs.AnnotationLayer({
      div,
      page,
      viewport
    });

    annotationLayer.render({
      annotations,
      linkService: new LinkService(pdfInstance, pdfElement, window.location.href)
    });

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
    scrollToPage(value, pdfElement.children);
  }
  else {
    pageNumber = value;

    updateFile(fileMetadata, { pageNumber });
    renderSinglePage(value);
    window.scrollTo(0, 0);

    if (updatePageInput) {
      updatePageInputElement(value);
    }
    updatePageBtnElementState(value);
  }
}

function previousPage() {
  let previousPageNumber = pageNumber - 1;

  if (previousPageNumber < 1) {
    previousPageNumber = 1;
  }
  setPage(previousPageNumber);
}

function nextPage() {
  const { pageCount } = fileMetadata;
  let nextPageNumber = pageNumber + 1;

  if (nextPageNumber > pageCount) {
    nextPageNumber = pageCount;
  }
  setPage(nextPageNumber);
}

function zoomIn() {
  setScale(Math.min(scale.currentScale * 1.1, maxScale));
}

function zoomOut() {
  setScale(Math.max(scale.currentScale / 1.1, minScale));
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

function updateZoomElementValue(scale) {
  for (const element of document.querySelectorAll(".viewer-zoom-value")) {
    element.textContent = scale.displayValue;
  }
}

function getInitialScale() {
  const { offsetWidth, offsetHeight } = document.documentElement;

  if (offsetWidth >= offsetHeight) {
    return {
      name: "fit-page",
      displayValue: "Fit page"
    };
  }
  return {
    name: "fit-width",
    displayValue: "Fit width"
  };
}

function setScale(value, name = "custom", noDelay) {
  if (!zooming) {
    unregisterIntersectionObserver();
    cleanupActiveZoomOption();
    zooming = true;
  }
  const oldScaleValue = scale.currentScale;
  let scrollTop = 0;
  let scrollLeft = 0;

  scale.name = name;
  scale.currentScale = value;

  if (name === "fit-width") {
    scale.displayValue = "Fit width";
  }
  else if (name === "fit-page") {
    scale.displayValue = "Fit page";
  }
  else {
    scale.displayValue = `${Math.round(value * 100 / defaultScale)}%`;
  }

  pdfElement.style.setProperty("--scale-factor", value);

  if (settings.pdf.viewMode === "multi") {
    const { top } = getPageElementBox(pageNumber, pdfElement.children);

    updatePages(value);
    views = getPageViews();

    scrollTop = views[pageNumber - 1].top - (top / oldScaleValue * value);
    scrollLeft = fileMetadata.scrollLeft / oldScaleValue * value;
  }
  else {
    updatePageInSingleMode(pageNumber);

    scrollTop = fileMetadata.scrollTop / oldScaleValue * value;
    scrollLeft = fileMetadata.scrollLeft / oldScaleValue * value;
  }
  updateZoomElementValue(scale);
  window.scrollTo(scrollLeft, scrollTop);

  clearTimeout(zoomTimeoutId);
  zoomTimeoutId = setTimeout(() => {
    zooming = false;

    if (settings.pdf.viewMode === "multi") {
      registerIntersectionObserver();
    }
    else {
      renderSinglePage(pageNumber);
    }
    settings.pdf.scale = scale;
    updateFile(fileMetadata, { scale: scale.currentScale, scrollTop, scrollLeft });
    setSettings(settings);
  }, noDelay ? 1 : 500);
}

async function getSelectedScale(value) {
  if (value === "fit-width") {
    const { offsetWidth, scrollHeight, offsetHeight } = document.documentElement;
    const { width, height } = await getPageViewport(pdfInstance, { pageNumber, rotation }, true);
    const maxHeight = offsetHeight - 16;
    let maxWidth = offsetWidth - 16;
    let scrollbarWidth = 0;
    const newScale = maxWidth / width;

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
    return maxWidth / width;
  }
  else if (value === "fit-page") {
    const { scrollWidth, offsetWidth, offsetHeight } = document.documentElement;
    const { width, height } = await getPageViewport(pdfInstance, { pageNumber, rotation }, true);
    const maxWidth = offsetWidth - 16;
    let maxHeight = offsetHeight - 16;
    let scrollbarWidth = 0;
    const newScale = maxHeight / height;

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
    return maxHeight / height;
  }
  return defaultScale * value;
}

async function handleZoomOptionClick({ target, currentTarget }) {
  const value = target.getAttribute("data-value");

  if (value) {
    const scale = await getSelectedScale(value);
    const prevActiveElement = currentTarget.querySelector(".active");

    setScale(scale, value, true);

    if (prevActiveElement) {
      prevActiveElement.classList.remove("active");
    }
    target.classList.add("active");
  }
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

  updateFile(fileMetadata, { viewMode: mode });

  if (mode === "multi") {
    await renderEmptyPages(pdfElement, pdfInstance, fileMetadata);
    views = getPageViews();
    scrollToPage(pageNumber, pdfElement.children, {
      scrollLeft: 0
    });
    registerIntersectionObserver();
    pdfElement.classList.add("offset");

    window.addEventListener("scroll", handleScroll);
    window.removeEventListener("scroll", handleSinglePageScroll);
    window.removeEventListener("click", handleAnnotationClick);
  }
  else {
    unregisterIntersectionObserver();
    await renderSingleEmptyPage(pdfElement, pdfInstance, fileMetadata);
    renderSinglePage(pageNumber);
    window.scrollTo(0, 0);

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

  updateFile(fileMetadata, { rotation });

  if (settings.pdf.viewMode === "multi") {
    updatePages(scale.currentScale);
    views = getPageViews();
    registerIntersectionObserver();
    scrollToPage(pageNumber, pdfElement.children);
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

async function renderEmptyPage(pageNumber, file, fragment, pdf) {
  const div = await getPageDiv(pdf, { ...file, pageNumber });

  fragment.appendChild(div);
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
  getNewPdfFile
};
