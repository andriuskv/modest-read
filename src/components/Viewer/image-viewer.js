import { v4 as uuidv4 } from "uuid";
import { dispatchCustomEvent, getImageDimensions, scrollToPage, getPageElementBox, getScrollbarWidth, getElementByAttr, getFileSizeString, resizeImageBlob } from "utils";
import * as fileService from "../../services/fileService";
import { getSettings, setSettings } from "../../services/settingsService";
import { startCounting, resetCounting } from "../../services/statsService";

const settings = getSettings();
const minScale = 0.25;
const maxScale = 5;
let fileMetadata = null;
let scale = null;
let containerElement = null;
let pageNumber = 1;
let rotation = 0;
let scrolling = false;
let observer = null;
let ctrlPressed = false;
let saveTimeoutId = 0;
let dataToSave = {};
let user = {};
let views = [];
let mouseDownStartPos = null;
let cleanupController = null;
let pageUnloadTimeoutIds = {};
let outlineVisible = false;
let outlineRendered = false;

async function initImageViewer(container, { metadata, blob }, loggedUser) {
  const zip = await fileService.deflateZip(blob);
  const imageBlobs = [];

  for (const item of Object.values(metadata.images)) {
    const blob = await zip.files[item.name].async("blob");
    item.blob = blob;
    imageBlobs.push(blob);
  }
  fileService.setImageBlobs(metadata.id, imageBlobs);
  user = loggedUser;
  containerElement = container;
  fileMetadata = metadata;
  scale = settings.image.scale || getInitialScale();
  rotation = metadata.rotation || 0;
  pageNumber = metadata.pageNumber || 1;
  cleanupController = new AbortController();
  document.body.style.overscrollBehavior = "none";

  if (settings.image.viewMode === "multi") {
    initScale(scale);
    renderEmptyPages(container, metadata);
    const { top } = getPageElementBox(pageNumber, containerElement.children);
    views = views.length ? views : getPageViews();
    window.scrollTo(0, top);
    window.addEventListener("scroll", handleScroll);
    registerIntersectionObserver();
  }
  else {
    renderSingleEmptyPage(pageNumber);
    renderSinglePage(pageNumber);
  }
  container.addEventListener("mousedown", handleMouseDownOnRendition);
  container.addEventListener("click", handleNavigationAreaClick);
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("wheel", handleWheel, { passive: false });

  const params = {
    viewMode: settings.image.viewMode,
    scale: metadata.scale,
    accessedAt: Date.now()
  };

  if (params.scale !== scale.currentScale) {
    params.scale = scale.currentScale;
  }
  updateFile(metadata, params, true);
  startCounting(!user.email);
}

function cleanupImageViewer(reloading) {
  cleanupPageUnloads();

  if (reloading) {
    if (containerElement) {
      containerElement.innerHTML = "";
    }
    resetCounting();
    clearTimeout(saveTimeoutId);
    cleanupViewMode();
    cleanupPageSelection();
  }
  cleanupOutline();
  cleanupController.abort();
  cleanupController = null;
  document.body.style.overscrollBehavior = "";
  unregisterIntersectionObserver();
  updateFile(fileMetadata, dataToSave, true);

  window.removeEventListener("scroll", handleScroll);
  document.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("keyup", handleKeyUp);
  document.removeEventListener("wheel", handleWheel, { passive: false });
  containerElement.removeEventListener("click", handleNavigationAreaClick);
  containerElement.removeEventListener("mousedown", handleMouseDownOnRendition);
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
    const { scrollTop } = document.documentElement;
    const oldPageNumber = pageNumber;
    pageNumber = getVisiblePageNumber(views, scrollTop < 0 ? 0 : scrollTop);
    updateFile(fileMetadata, { pageNumber });

    if (pageNumber !== oldPageNumber) {
      updatePageInputElement(pageNumber);
      updatePageBtnElementState(pageNumber);
    }
    scrolling = false;
  });
}

function handleMouseDownOnRendition(event) {
  mouseDownStartPos = {
    x:  event.screenX,
    y:  event.screenY
  };
}

function handleNavigationAreaClick(event) {
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
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    previousPage();
  }
  else if (event.key === "ArrowRight") {
    event.preventDefault();
    nextPage();
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

function getVisiblePageNumber(views, top) {
  for (let i = 0; i < views.length - 1; i += 1) {
    const view = views[i];
    const view2 = views[i + 1];
    const offset = view.top + (view.height / 2);
    const offset2 = view2.top + (view2.height / 2);

    if (top >= offset && top <= offset2 || i === views.length - 2 && top >= offset2) {
      return i + 2;
    }
  }
  return 1;
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

  if (!previousPageElement || !nextPageElement) {
    return;
  }

  if (pageNumber === 1) {
    previousPageElement.disabled = true;
  }
  else if (pageNumber === fileMetadata.images.length) {
    nextPageElement.disabled = true;
  }
  else {
    previousPageElement.disabled = false;
    nextPageElement.disabled = false;
  }
}

function registerIntersectionObserver() {
  if (observer) {
    observer.disconnect();
  }
  const height = document.documentElement.offsetHeight / 2;
  observer = new IntersectionObserver(callback, { rootMargin: `${height}px 0px` });

  for (const element of containerElement.children) {
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
    if (isIntersecting) {
      const page = target.getAttribute("data-page-number");
      clearTimeout(pageUnloadTimeoutIds[page]);
      delete pageUnloadTimeoutIds[page];

      if (target.hasAttribute("data-loaded")) {
        return;
      }
      renderPageContent(target);
    }
    else if (target.hasAttribute("data-loaded")) {
      const page = target.getAttribute("data-page-number");
      clearTimeout(pageUnloadTimeoutIds[page]);
      pageUnloadTimeoutIds[page] = setTimeout(() => {
        target.removeAttribute("data-loaded");
        URL.revokeObjectURL(target.firstElementChild.src);
        target.innerHTML = "";
        delete pageUnloadTimeoutIds[page];
      }, 30000);
    }
  });
}

function getPageViews() {
  return Array.from(containerElement.children).map(element => {
    return {
      top: element.offsetTop,
      left: element.offsetLeft,
      width: element.offsetWidth,
      height: element.offsetHeight
    };
  });
}

function renderPageContent(container) {
  const number = parseInt(container.getAttribute("data-page-number"), 10);
  const img = document.createElement("img");

  container.setAttribute("data-loaded", "true");
  img.classList.add("viewer-page-image");
  img.src = URL.createObjectURL(fileMetadata.images[number - 1].blob);
  container.appendChild(img);
}

function initScale(scale) {
  scale.currentScale = getSelectedScale(scale.name);
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

function getSelectedScale(value) {
  let images = fileMetadata.images;

  if (settings.image.viewMode === "single") {
    images = [fileMetadata.images[pageNumber - 1]];
  }

  if (value === "fit-width") {
    const { scrollWidth, offsetWidth, offsetHeight } = document.documentElement;

    for (const [index, image] of Object.entries(images)) {
      const { width, height } = swapDimensions(image, rotation);
      const maxHeight = offsetHeight;
      let maxWidth = offsetWidth - 10;
      let scrollbarWidth = 0;
      const newScale = maxWidth / width;

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
      maxWidth += scrollbarWidth;
      images[index].scale = maxWidth / width;
    }
    return fileMetadata.images[pageNumber - 1].scale;
  }
  else if (value === "fit-page") {
    const { scrollWidth, offsetWidth, offsetHeight } = document.documentElement;

    for (const [index, image] of Object.entries(images)) {
      const { width, height } = swapDimensions(image, rotation);
      const maxWidth = offsetWidth;
      let maxHeight = offsetHeight;
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
      images[index].scale = maxHeight / height;
    }
    return fileMetadata.images[pageNumber - 1].scale;
  }

  for (const image of Object.values(images)) {
    image.scale = value;
  }
  return value;
}

async function getNewArchiveFile(file, user, fileType) {
  const zip = await fileService.deflateZip(file);
  const items = Object.values(zip.files);
  const id = uuidv4();
  const imageBlobs = [];
  const params = {};

  if (!user.email) {
    params.local = true;
  }
  params.pageCount = 0;
  params.images = [];

  for (const item of items) {
    if (item.dir) {
      continue;
    }
    const fileName = item.name;
    const fileExtension = fileName.split(".").at(-1).toLowerCase();

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension)) {
      const imageBlob = await zip.files[fileName].async("blob");
      const dims = await getImageDimensions(imageBlob);
      const imageFile = {
        id: uuidv4(),
        date: new Date(item.date).getTime(),
        name: fileName,
        size: imageBlob.size,
        type: "image",
        ...dims,
        sizeString: getFileSizeString(imageBlob.size),
        blob: imageBlob
      };
      imageBlobs.push(imageBlob);
      params.images.push(imageFile);
    }
  }
  params.pageCount = params.images.length;
  fileService.setImageBlobs(id, imageBlobs);

  return {
    ...params,
    id,
    name: file.name,
    type: fileType,
    createdAt: Date.now(),
    size: file.size,
    sizeString: getFileSizeString(file.size),
    pageNumber: 1,
    viewMode: "multi",
    coverImage: imageBlobs.length ? await resizeImageBlob(URL.createObjectURL(imageBlobs[0])) : null
  };
}

function initToolbar() {
  initZoomOptions(scale);
  initPage();
  initViewMode();
  initOutline();
}

async function initOutline() {
  const toggleBtn = document.getElementById("js-viewer-outline-toggle-btn");

  toggleBtn.classList.add("visible");
  toggleBtn.addEventListener("click", toggleOutline);
}

async function toggleOutline() {
  const container = document.getElementById("js-viewer-outline");

  outlineVisible = !outlineVisible;
  container.classList.toggle("visible", outlineVisible);
  document.documentElement.style.overflow = outlineVisible ? "hidden" : "";

  if (!outlineVisible) {
    return;
  }

  if (!outlineRendered) {
    const blobs = fileService.getImageBlobs(fileMetadata.id);
    const div = document.createElement("div");
    const items = [];

    for (const [index, blob] of Object.entries(blobs)) {
      items.push(`
        <li class="viewer-outline-image-list-item">
          <img src="${URL.createObjectURL(blob)}" class="viewer-outline-image-list-img" data-outline-index="${index}"/>
        </li>
      `);
    }
    div.classList.add("viewer-outline");
    div.insertAdjacentHTML("beforeend", `<ul class="viewer-outline-image-list">${items.join("\n")}</ul>`);
    container.append(div);
    container.addEventListener("click", handleOutlineClick);
    outlineRendered = true;
  }
  clearActiveOutlineItem();

  const element = document.querySelector(`[data-outline-index="${pageNumber - 1}"]`);

  if (element) {
    element.parentElement.classList.add("active");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      element.scrollIntoView({
        block: "center",
        inline: "center"
      });
    }));
  }
}

function clearActiveOutlineItem() {
  for (const element of document.querySelectorAll(".viewer-outline-image-list-item.active")) {
    element.classList.remove("active");
  }
}

function cleanupOutline() {
  const container = document.getElementById("js-viewer-outline");
  const toggleBtn = document.getElementById("js-viewer-outline-toggle-btn");
  outlineRendered = false;
  outlineVisible = false;

  if (container.firstElementChild) {
    toggleBtn.removeEventListener("click", toggleOutline);
    container.firstElementChild.remove();
  }
  container.classList.remove("visible");
  container.removeEventListener("click", handleOutlineClick);
  toggleBtn.classList.remove("visible");
}

function handleOutlineClick(event) {
  if (event.target === event.currentTarget) {
    outlineVisible = false;
    event.currentTarget.classList.remove("visible");
    document.documentElement.style.overflow = "";
    return;
  }
  const element = event.target.closest("[data-outline-index]");

  if (element) {
    const index = Number(element.getAttribute("data-outline-index"));

    clearActiveOutlineItem();
    element.parentElement.classList.add("active");
    setPage(index + 1);
  }
}

function initZoomOptions() {
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
}

function zoomOut() {
  setScale(Math.max(scale.currentScale / 1.1, minScale));
}

function handleZoomOptionClick({ target, currentTarget }) {
  const name = target.getAttribute("data-value");

  if (name) {
    const scale = getSelectedScale(name);
    const prevActiveElement = currentTarget.querySelector(".active");

    setScale(scale, name);

    if (prevActiveElement) {
      prevActiveElement.classList.remove("active");
    }
    target.classList.add("active");
  }
}

function setScale(value, name = "custom") {
  unregisterIntersectionObserver();
  cleanupActiveZoomOption();

  let scrollTop = 0;
  scale.name = name;
  scale.currentScale = value;

  if (name === "fit-width") {
    scale.displayValue = "Fit width";
  }
  else if (name === "fit-page") {
    scale.displayValue = "Fit page";
  }
  else {
    scale.displayValue = `${Math.round(value * 100)}%`;
  }

  if (settings.image.viewMode === "multi") {
    updatePages(value);
    views = getPageViews();
    scrollTop = views[pageNumber - 1].top;
  }
  else {
    updatePageInSingleMode(pageNumber);
    scrollTop = 0;
  }
  updateZoomElementValue(scale);
  window.scrollTo(0, scrollTop);

  if (settings.image.viewMode === "multi") {
    registerIntersectionObserver();
  }
  settings.image.scale = scale;
  updateFile(fileMetadata, { scale: scale.currentScale });
  setSettings(settings);
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

function initPage() {
  const previousPageElement = document.getElementById("js-viewer-previous-page");
  const nextPageElement = document.getElementById("js-viewer-next-page");
  const pageInputContainerElement = document.getElementById("js-viewer-page-input-container");
  const pageInputElement = document.getElementById("js-viewer-page-input");

  pageInputContainerElement.lastElementChild.textContent = `of ${fileMetadata.images.length}`;

  updatePageInputElement(pageNumber);
  updatePageBtnElementState(pageNumber);

  pageInputContainerElement.addEventListener("click", handlePageInputContainerClick);

  previousPageElement.addEventListener("click", previousPage);
  nextPageElement.addEventListener("click", nextPage);

  pageInputElement.addEventListener("focus", handlePageInputFocus);
  pageInputElement.addEventListener("blur", handlePageInputBlur);
  pageInputElement.addEventListener("keydown", handlePageInputKeydown);

  containerElement.style.setProperty("--rotation", `${rotation}deg`);
  document.getElementById("js-viewer-outline").style.setProperty("--rotation", `${rotation}deg`);
  document.getElementById("js-viewer-rotate-btn").addEventListener("click", rotatePage);
}

function initViewMode() {
  const viewModesElement = document.getElementById("js-viewer-view-modes");
  const [singlePageViewElement, multiPageViewElement] = viewModesElement.children;

  if (settings.image.viewMode === "single") {
    singlePageViewElement.classList.add("active");
  }
  else {
    multiPageViewElement.classList.add("active");
  }
  viewModesElement.addEventListener("click", setViewMode);
}

function setViewMode(event) {
  const element = getElementByAttr("data-mode", event.target, event.currentTarget);

  if (!element) {
    return;
  }
  const { attrValue: mode } = element;

  if (mode === settings.image.viewMode) {
    return;
  }
  const [singlePageViewElement, multiPageViewElement] = event.currentTarget.children;

  singlePageViewElement.classList.toggle("active");
  multiPageViewElement.classList.toggle("active");

  containerElement.innerHTML = "";
  settings.image.viewMode = mode;

  updateFile(fileMetadata, { viewMode: mode });

  if (mode === "multi") {
    initScale(scale);
    renderEmptyPages(containerElement, fileMetadata);
    views = getPageViews();
    scrollToPage(pageNumber, containerElement.children, {
      scrollLeft: 0
    });
    registerIntersectionObserver();
    window.addEventListener("scroll", handleScroll);
  }
  else {
    unregisterIntersectionObserver();
    renderSingleEmptyPage(pageNumber);
    renderSinglePage(pageNumber);
    window.scrollTo(0, 0);
    window.removeEventListener("scroll", handleScroll);
  }
  setSettings(settings);
}

function rotatePage() {
  const nextRotation = rotation + 90;

  rotation = nextRotation === 360 ? 0 : nextRotation;
  containerElement.style.setProperty("--rotation", `${rotation}deg`);
  document.getElementById("js-viewer-outline").style.setProperty("--rotation", `${rotation}deg`);

  updateFile(fileMetadata, { rotation });

  if (settings.image.viewMode === "multi") {
    updatePages(scale.currentScale);
    views = getPageViews();
    registerIntersectionObserver();
    scrollToPage(pageNumber, containerElement.children);
  }
  else {
    updatePageInSingleMode(pageNumber);
    window.scrollTo(0, 0);
  }
}

function handlePageInputContainerClick(event) {
  if (event.target !== event.currentTarget.firstElementChild) {
    event.currentTarget.firstElementChild.focus();
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
  const count = fileMetadata.images.length;
  let nextPageNumber = pageNumber + 1;

  if (nextPageNumber > count) {
    nextPageNumber = count;
  }
  setPage(nextPageNumber);
}

function setPage(value, updatePageInput = true) {
  if (settings.image.viewMode === "multi") {
    scrollToPage(value, containerElement.children);
  }
  else if (value !== pageNumber) {
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

function renderEmptyPages(container, file) {
  const fragment = new DocumentFragment();

  for (let i = 0; i < file.images.length; i += 1) {
    const image = file.images[i];
    const { width, height, swapped } = swapDimensions(image, rotation);
    const div = document.createElement("div");

    div.style.setProperty("--width", `${width * image.scale}px`);
    div.style.setProperty("--height", `${height * image.scale}px`);
    div.classList.toggle("swap", swapped);
    div.setAttribute("data-page-number", i + 1);
    div.classList.add("viewer-image-container");

    fragment.appendChild(div);
  }
  container.appendChild(fragment);
}

function updatePages(globalScale) {
  for (const [index, element] of Object.entries(containerElement.children)) {
    const image = fileMetadata.images[index];
    const { scale: localScale } = image;
    const { width, height, swapped } = swapDimensions(image, rotation);
    const value = scale.name === "custom" ? globalScale: localScale;

    element.style.setProperty("--width", `${width * value}px`);
    element.style.setProperty("--height", `${height * value}px`);
    element.classList.toggle("swap", swapped);
  }
}

function swapDimensions({ width, height }, rotation) {
  if (rotation === 90 || rotation === 270) {
    return {
      swapped: true,
      width: height,
      height: width
    };
  }
  return {
    swapped: false,
    width,
    height
  };
}

function renderSingleEmptyPage(pageNumber) {
  const image = fileMetadata.images[pageNumber - 1];
  const div = document.createElement("div");
  const { width, height, swapped } = swapDimensions(image, rotation);

  div.style.setProperty("--width", `${width * image.scale}px`);
  div.style.setProperty("--height", `${height * image.scale}px`);
  div.classList.toggle("swap", swapped);

  div.setAttribute("data-page-number", pageNumber);
  div.classList.add("viewer-image-container");
  containerElement.appendChild(div);
}

function renderSinglePage(pageNumber) {
  containerElement.firstElementChild.innerHTML = "";
  updatePageInSingleMode(pageNumber);
  renderPageContent(containerElement.firstElementChild);
}

function updatePageInSingleMode(pageNumber) {
  const image = fileMetadata.images[pageNumber - 1];
  const element = containerElement.firstElementChild;
  const { width, height, swapped } = swapDimensions(image, rotation);

  element.setAttribute("data-page-number", pageNumber);
  element.style.setProperty("--width", `${width * scale.currentScale}px`);
  element.style.setProperty("--height", `${height * scale.currentScale}px`);
  element.classList.toggle("swap", swapped);
}

function cleanupPageUnloads() {
  for (const page of Object.keys(pageUnloadTimeoutIds)) {
    URL.revokeObjectURL(containerElement.children[page - 1].firstElementChild.src);
    clearTimeout(pageUnloadTimeoutIds[page]);
  }
  pageUnloadTimeoutIds = {};
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

export {
  initImageViewer,
  cleanupImageViewer,
  initToolbar,
  getNewArchiveFile
};
