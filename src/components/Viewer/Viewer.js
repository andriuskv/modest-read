import { useState, useEffect, useRef, useCallback } from "react";
import { useHistory, useParams } from "react-router-dom";
import * as pdfjs from "pdfjs-dist/webpack";
import { v4 as uuidv4 } from "uuid";
import { setDocumentTitle, pageToDataURL, getPdfInstance, parseMetadata, getPageElementBox, scrollToPage } from "../../utils";
import { fetchIDBFiles, saveFile, fetchIDBFile } from "../../services/fileIDBService";
import { fetchCurrentFile, saveCurrentFile } from "../../services/currentFileIDBService";
import { getSettings } from "../../services/settingsService";
import LinkService from "../../services/viewerLinkService";
import Icon from "../Icon";
import FilePreview from "./FilePreview";
import Toolbar from "./Toolbar";
import DropModal from "./DropModal";
import NoFileNotice from "./NoFileNotice";
import "./viewer.scss";

export default function Viewer() {
  const history = useHistory();
  const { id } = useParams();
  const [state, setState] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(() => getDefaultScale());
  const [fileLoadMessage, setFileLoadMessage] = useState(null);
  const [settings, setSettings] = useState(() => getSettings());
  const [preferences, setPreferences] = useState(() => {
    const preferences = JSON.parse(localStorage.getItem("viewer-preferences")) || {
      saveFile: true,
      viewMode: "multi"
    };

    if (!preferences.viewMode) {
      preferences.viewMode = "multi";
    }
    preferences.saveFile = true;
    return preferences;
  });
  const pdfRef = useRef(null);
  const pageRendering = useRef(false);
  const pendingPages = useRef([]);
  const observer = useRef(null);
  const scrollTimeout = useRef(0);
  const updatingPageNumber = useRef(false);
  const updatingPages = useRef(false);
  const scrollDirection = useRef(0);
  const ctrlPressed = useRef(false);
  const initStage = useRef(true);
  const memoizedScrollHandler = useCallback(handleScroll, [scale, preferences]);
  const memoizedSinglePageScrollHandler = useCallback(handleSinglePageScroll, [pageNumber, preferences]);
  const memoizedClickHandler = useCallback(handleClick, [state, preferences]);
  const memoizedWheelHandler = useCallback(handleWheel, [scale]);
  const memoizedKeyUpHandler = useCallback(handleKeyUp, [scale]);
  const memoizedKeyDownHandler = useCallback(handleKeyDown, [scale, pageNumber]);
  const memoizedDropHandler = useCallback(handleDrop, [state]);

  useEffect(() => {
    init();

    return () => {
      document.body.style.overscrollBehavior = "";
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!state || !state.instance) {
      return;
    }
    window.addEventListener("wheel", memoizedWheelHandler, { passive: false });
    window.addEventListener("keyup", memoizedKeyUpHandler);

    return () => {
      window.removeEventListener("wheel", memoizedWheelHandler, { passive: false });
      window.removeEventListener("keyup", memoizedKeyUpHandler);
    };
  }, [memoizedWheelHandler, memoizedKeyUpHandler]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener("keydown", memoizedKeyDownHandler);

    return () => {
      window.removeEventListener("keydown", memoizedKeyDownHandler);
    };
  }, [memoizedKeyDownHandler]);

  useEffect(() => {
    if (preferences.viewMode === "single") {
      window.removeEventListener("scroll", memoizedScrollHandler);
      return;
    }
    window.addEventListener("scroll", memoizedScrollHandler);

    return () => {
      window.removeEventListener("scroll", memoizedScrollHandler);
    };
  }, [memoizedScrollHandler]);

  useEffect(() => {
    if (!state || !state.instance) {
      return;
    }
    else if (preferences.viewMode === "multi") {
      window.removeEventListener("scroll", memoizedSinglePageScrollHandler);
      return;
    }
    window.addEventListener("scroll", memoizedSinglePageScrollHandler);

    return () => {
      window.removeEventListener("scroll", memoizedSinglePageScrollHandler);
    };
  }, [memoizedSinglePageScrollHandler]);

  useEffect(() => {
    if (!state || !state.instance) {
      return;
    }
    else if (preferences.viewMode === "multi") {
      window.removeEventListener("click", memoizedClickHandler);
      return;
    }
    window.addEventListener("click", memoizedClickHandler);

    return () => {
      window.removeEventListener("click", memoizedClickHandler);
    };
  }, [memoizedClickHandler]);

  useEffect(() => {
    window.addEventListener("drop", memoizedDropHandler);
    window.addEventListener("dragover", handleDragover);

    return () => {
      window.removeEventListener("drop", memoizedDropHandler);
      window.removeEventListener("dragover", handleDragover);
    };
  }, [memoizedDropHandler]);

  useEffect(() => {
    if (!state || !state.instance || preferences.viewMode === "single") {
      return;
    }

    function updatePages(scaleValue) {
      for (const [index, element] of Object.entries(pdfRef.current.children)) {
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

    function updatePagesWithNewScale(newScale) {
      const { scrollLeft } = document.documentElement;
      const { top } = getPageElementBox(pageNumber, pdfRef.current.children);
      const newScaleValue = newScale.currentScale;
      const scaleRatio = newScaleValue / state.file.scale.currentScale;

      updatePages(newScaleValue);

      state.file.scale = newScale;
      state.views = getPageViews();
      state.file.scrollTop = state.views[pageNumber - 1].top - top * scaleRatio;
      state.file.scrollLeft = scrollLeft * scaleRatio;
      state.pagesInViewport = getVisiblePageCount(state.views);

      window.scrollTo(state.file.scrollLeft, state.file.scrollTop);
      setState({ ...state });

      if (!initStage.current && preferences.saveFile) {
        saveFile(state.file);
      }
    }

    function callback(entries) {
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting || (target.hasAttribute("data-loaded") && !target.hasAttribute("data-rerender-needed"))) {
          return;
        }

        if (pageRendering.current) {
          pendingPages.current.push(target);
        }
        else {
          pageRendering.current = true;
          target.setAttribute("data-loaded", "true");
          renderPageContent(target);
        }
      });
    }

    updatePagesWithNewScale(scale);

    if (observer.current) {
      observer.current.disconnect();
    }
    observer.current = new IntersectionObserver(callback, {
      rootMargin: `${state.maxHeight * state.file.scale.currentScale}px 0px`
    });
    Array.from(pdfRef.current.children).forEach(element => {
      observer.current.observe(element);
    });
    updatingPages.current = false;
    initStage.current = false;
  }, [scale, preferences.viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSinglePageChange() {
    const pageElement = pdfRef.current.firstElementChild;

    if (pageElement.classList.contains("hidden")) {
      pageElement.classList.remove("hidden");
      window.scrollTo(state.file.scrollLeft, state.file.scrollTop);
    }
    pageElement.setAttribute("data-page-number", pageNumber);
    updatePageInSingleMode(pageNumber, scale.currentScale);
    await renderPageContent(pageElement);
    pageElement.setAttribute("data-loaded", "true");

    if (pageNumber !== state.file.pageNumber) {
      window.scrollTo(0, 0);
    }
    state.file.pageNumber = pageNumber;
    state.file.scale = scale;

    setState({ ...state });

    if (preferences.saveFile) {
      saveFile(state.file);
    }
  }

  useEffect(() => {
    if (!state || !state.instance || preferences.viewMode === "multi") {
      return;
    }
    else if (initStage.current) {
      initStage.current = false;
      return;
    }
    handleSinglePageChange();
  }, [scale, pageNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  async function init() {
    if (history.location.state) {
      return;
    }
    const file = await fetchIDBFile(id);

    if (file) {
      const currentFile = await fetchCurrentFile();

      if (file.scale?.value) {
        file.scale = {
          ...getDefaultScale(),
          name: file.scale.name,
          currentScale: file.scale.value
        };
      }

      if (currentFile && currentFile.name === file.name) {
        loadFile(currentFile, {
          fileMetadata: file
        });
      }
      else {
        setState({ file, filePreviewVisible: true });
      }
      setDocumentTitle(file.name);
      document.body.style.overscrollBehavior = "none";
    }
    else {
      setState({ error: true });
      setDocumentTitle("Error");
    }
  }

  function updatePageInSingleMode(pageNumber, scaleValue) {
    const { width, height } = getScaledPageDimensions(pageNumber - 1, scaleValue);
    const element = pdfRef.current.firstElementChild;

    element.style.width = `${width}px`;
    element.style.height = `${height}px`;

    if (element.hasAttribute("data-loaded")) {
      const canvas = element.firstElementChild;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      element.setAttribute("data-rerender-needed", true);
    }
  }

  function getScaledPageDimensions(index, scale) {
    const pageDimension = state.pageDimensions[index];
    const width = Math.floor(pageDimension.width * scale);
    const height = Math.floor(pageDimension.height * scale);

    return { width, height };
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
    const page = await state.instance.getPage(number);
    const viewport = page.getViewport({ scale: scale.currentScale });

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

    if (pendingPages.current.length) {
      while (pendingPages.current.length) {
        const element = scrollDirection.current === 1 ? pendingPages.current.pop() : pendingPages.current.shift();
        element.setAttribute("data-loaded", "true");
        renderPageContent(element);
      }
    }
    else {
      pageRendering.current = false;
    }
  }

  function handleScroll() {
    if (updatingPageNumber.current) {
      return;
    }
    updatingPageNumber.current = true;

    requestAnimationFrame(() => {
      const { scrollTop, scrollLeft } = document.documentElement;
      const oldPageNumber = state.file.pageNumber;
      scrollDirection.current = scrollTop > state.file.scrollTop ? 1 : -1;
      state.file.scrollTop = scrollTop < 0 ? 0 : scrollTop;
      state.file.scrollLeft = scrollLeft;
      state.file.pageNumber = getVisiblePageNumber(state.views, state.file.scrollTop);

      if (preferences.saveFile) {
        clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
          saveFile(state.file);
        }, 1000);
      }

      if (state.file.pageNumber !== oldPageNumber) {
        setPageNumber(state.file.pageNumber);
        setState({ ...state });
      }
      updatingPageNumber.current = false;
    });
  }

  function handleSinglePageScroll() {
    if (updatingPageNumber.current) {
      return;
    }
    updatingPageNumber.current = true;

    requestAnimationFrame(() => {
      const { scrollTop, scrollLeft } = document.documentElement;
      state.file.scrollTop = scrollTop < 0 ? 0 : scrollTop;
      state.file.scrollLeft = scrollLeft;

      if (preferences.saveFile) {
        clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
          saveFile(state.file);
        }, 1000);
      }
      setState({ ...state });
      updatingPageNumber.current = false;
    });
  }

  async function handleClick(event) {
    if (event.target.nodeName === "A") {
      const url = new URL(event.target.href);

      if (url.origin !== window.location.origin) {
        return;
      }
      const arr = url.hash.split("#");
      const data = unescape(arr[arr.length - 1]);
      let dest = "";

      try {
        dest = JSON.parse(data);
      } catch {
        dest = await state.instance.getDestination(data);
      }
      const index = await state.instance.getPageIndex(dest[0]);
      setPageNumber(index + 1);
    }
  }

  function handleWheel(event) {
    if (ctrlPressed.current) {
      event.preventDefault();

      if (event.wheelDelta > 0) {
        zoomIn();
      }
      else {
        zoomOut();
      }
    }
  }

  function handleKeyDown(event) {
    if (event.target.nodeName === "INPUT") {
      return;
    }
    ctrlPressed.current = event.ctrlKey;

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
        previousPage();
        event.preventDefault();
      }
      else if (event.key === "ArrowRight") {
        nextPage();
        event.preventDefault();
      }
    }
  }

  function handleKeyUp(event) {
    ctrlPressed.current = event.ctrlKey;
  }

  function handleDrop(event) {
    event.preventDefault();

    if (event.dataTransfer.files.length) {
      const [file] = event.dataTransfer.files;

      uploadFile(file);
    }
  }

  function handleDragover(event) {
    event.preventDefault();
  }

  function getDefaultScale() {
    return {
      name: "1",
      currentScale: 1.3333,
      initialScale: 1.3333,
      minScale: 0.333325,
      maxScale: 13.333
    };
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
      linkService: new LinkService(state.instance, pdfRef.current, window.location.href)
    };

    if (annotationLayerDiv && preferences.viewMode === "multi") {
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

  function getPageViews() {
    return Array.from(pdfRef.current.children).map(element => {
      return {
        top: element.offsetTop,
        left: element.offsetLeft,
        width: element.offsetWidth,
        height: element.offsetHeight
      };
    });
  }

  function getVisiblePageCount(views) {
    if (views.length < 2) {
      return 1;
    }
    const count = Math.ceil(document.documentElement.offsetHeight / ((views[0].height + views[1].height) / 2));

    if (count < 2) {
      return 2;
    }
    return count;
  }

  async function getPageDimensions(pdf) {
    const dimensions = [];

    for (let i = 0; i < pdf.numPages; i += 1) {
      const page = await pdf.getPage(i + 1);
      const { width, height } = page.getViewport({ scale: 1 });

      dimensions.push({ width, height });
    }
    return dimensions;
  }

  async function getPageDiv(pdf, scale, pageNumber) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: scale.currentScale });
    const div = document.createElement("div");

    div.style.width = `${Math.floor(viewport.width)}px`;
    div.style.height = `${Math.floor(viewport.height)}px`;

    div.setAttribute("data-page-number", pageNumber);
    div.classList.add("viewer-page");
    return div;
  }

  async function renderEmptyPage(pageNumber, scale, fragmenet, pdf) {
    const div = await getPageDiv(pdf, scale, pageNumber);

    fragmenet.appendChild(div);
  }

  async function renderSingleEmptyPage(pdf, fileMetadata, hide) {
    const div = await getPageDiv(pdf, fileMetadata.scale, fileMetadata.pageNumber);

    if (hide) {
      div.classList.add("hidden");
    }
    pdfRef.current.appendChild(div);
  }

  async function renderEmptyPages(pdf, scale) {
    const fragment = new DocumentFragment();
    const promises = [];

    for (let i = 0; i < pdf.numPages; i += 1) {
      promises.push(renderEmptyPage(i + 1, scale, fragment, pdf));
    }
    await Promise.all(promises);
    pdfRef.current.appendChild(fragment);
  }

  async function loadFile(file, { save = true, fileMetadata = null, pdfInstance = null } = {}) {
    fileMetadata.scale = fileMetadata.scale || getDefaultScale();
    fileMetadata.pageNumber = fileMetadata.pageNumber || 1;
    const pdf = pdfInstance || await getPdfInstance(file, pdfjs);
    const [{ maxWidth, maxHeight }, pageDimensions] = await Promise.all([
      findBiggestDimensions(pdf, fileMetadata.pageCount),
      getPageDimensions(pdf),
      preferences.viewMode === "multi" ?
        renderEmptyPages(pdf, fileMetadata.scale) :
        renderSingleEmptyPage(pdf, fileMetadata, true)
    ]);

    delete state?.filePreviewVisible;

    setState({
      ...state,
      instance: pdf,
      pageDimensions,
      file: fileMetadata,
      maxWidth,
      maxHeight
    });

    window.scrollTo(fileMetadata.scrollLeft, fileMetadata.scrollTop);
    setScale(fileMetadata.scale);
    setPageNumber(fileMetadata.pageNumber);

    if (fileMetadata.status !== "have read") {
      if (fileMetadata.pageCount === 1) {
        fileMetadata.status = "have read";
      }
      else {
        fileMetadata.status = "reading";
      }
    }
    fileMetadata.accessedAt = Date.now();

    if (save) {
      saveLoadedFile(file, fileMetadata);
    }
  }

  async function findFile(file) {
    const files = await fetchIDBFiles();
    return files.find(({ name }) => name === file.name);
  }

  function loadPreviewFile() {
    loadNewFile(fileLoadMessage);
    hideFileLoadMessage();
  }

  async function loadNewFile({ file, save = true }) {
    let newFile = await findFile(file);
    let pdf = null;

    if (!newFile) {
      pdf = await getPdfInstance(file, pdfjs);
      const [metadata, coverImage] = await Promise.all([pdf.getMetadata(), pageToDataURL(pdf)]);
      newFile = {
        ...parseMetadata(metadata),
        id: uuidv4(),
        name: file.name,
        createdAt: Date.now(),
        scale: getDefaultScale(),
        pageCount: pdf.numPages,
        coverImage
      };

      if (!fileLoadMessage) {
        save = preferences.dropWarningHidden ? preferences.saveDroppedFile : false;

        if (!preferences.dropWarningHidden) {
          setFileLoadMessage({
            file,
            type: "warning",
            value: "Do you want to save this file?"
          });
        }
      }
    }
    setPreferences({ ...preferences, saveFile: save });
    loadFile(file, {
      fileMetadata: newFile,
      save,
      pdf
    });
    history.replace({ pathname: `/viewer/${newFile.id}`, state: true });
    setDocumentTitle(newFile.name);
  }

  async function uploadFile(file) {
    if (!file.name.endsWith(".pdf")) {
      setFileLoadMessage({
        file,
        type: "negative",
        value: "File format is not supported."
      });
    }
    else if (file.name !== state.file.name) {
      if (state.filePreviewVisible) {
        setFileLoadMessage({
          file,
          type: "warning",
          value: "File does not match currently loaded file.\nDo you want to load it anyway?"
        });
      }
      else {
        initStage.current = true;
        pdfRef.current.innerHTML = "";

        loadNewFile({ file });
        window.removeEventListener("scroll", memoizedScrollHandler);
      }
    }
    else {
      loadFile(file, { fileMetadata: state.file });
      hideFileLoadMessage();
    }
  }

  function saveLoadedFile(file, fileMetadata) {
    saveFile(fileMetadata);
    saveCurrentFile(file);
  }

  function saveDroppedFile(preferences) {
    saveLoadedFile(fileLoadMessage.file, state.file);
    hideDropModal(preferences);
  }

  function hideDropModal(preferences) {
    preferences.saveFile = preferences.saveDroppedFile;

    hideFileLoadMessage();
    setPreferences(preferences);
  }

  function handleFileUpload(event) {
    const [file] = event.target.files;

    uploadFile(file);
    event.target.value = "";
  }

  async function findBiggestDimensions(pdf, pageCount) {
    let maxWidth = 0;
    let maxHeight = 0;

    for (let i = 1; i <= Math.min(3, pageCount); i += 1) {
      const page = await pdf.getPage(i);
      const { width, height } = page.getViewport({ scale: 1 });

      if (width > maxWidth) {
        maxWidth = width;
      }

      if (height > maxHeight) {
        maxHeight = height;
      }
    }
    return {
      maxWidth: Math.floor(maxWidth),
      maxHeight: Math.floor(maxHeight)
    };
  }

  async function handleSelect(event) {
    let newScale = 0;

    if (event.target.value === "fit-width") {
      const maxWidth = document.documentElement.offsetWidth - 16;
      newScale = maxWidth / state.maxWidth;
    }
    else if (event.target.value === "fit-page") {
      const { keepToolbarVisible } = settings;
      const maxHeight = document.documentElement.offsetHeight - (keepToolbarVisible ? 56 : 16);
      newScale = maxHeight / state.maxHeight;
    }
    else {
      newScale = scale.initialScale * event.target.value;
    }
    updatingPages.current = true;

    setScale({
      ...scale,
      name: event.target.value,
      currentScale: newScale
    });
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

  function zoomOut() {
    const newScale = Math.max(scale.currentScale / 1.1, scale.minScale);
    updatingPages.current = true;

    setScale({
      ...scale,
      name: "custom",
      currentScale: newScale,
      displayValue: Math.round(newScale * 100 / scale.initialScale)
    });
  }

  function zoomIn() {
    const newScale = Math.min(scale.currentScale * 1.1, scale.maxScale);
    updatingPages.current = true;

    setScale({
      ...scale,
      name: "custom",
      currentScale: newScale,
      displayValue: Math.round(newScale * 100 / scale.initialScale)
    });
  }

  function previousPage() {
    if (preferences.viewMode === "single") {
      setPageNumber(pageNumber - 1);
    }
    else {
      scrollToPage(pageNumber - 1, pdfRef.current.children, settings.keepToolbarVisible);
    }
  }

  function nextPage() {
    if (preferences.viewMode === "single") {
      setPageNumber(pageNumber + 1);
    }
    else {
      scrollToPage(pageNumber + 1, pdfRef.current.children, settings.keepToolbarVisible);
    }
  }

  function scrollToNewPage(newPageNumber) {
    scrollToPage(newPageNumber, pdfRef.current.children, settings.keepToolbarVisible);
    setPageNumber(newPageNumber);
  }

  function hideFileLoadMessage() {
    setFileLoadMessage(null);
  }

  function updateSettings(setting, value) {
    setSettings({ ...settings, [setting]: value });
  }

  async function changeViewMode(mode) {
    const updatedPreferences = {
      ...preferences,
      viewMode: mode
    };
    pdfRef.current.innerHTML = "";

    if (mode === "multi") {
      await renderEmptyPages(state.instance, state.file.scale);
      scrollToNewPage(pageNumber);
    }
    else {
      window.removeEventListener("scroll", memoizedScrollHandler);
      await renderSingleEmptyPage(state.instance, state.file);
      updatePageInSingleMode(pageNumber, scale.currentScale);
      await renderPageContent(pdfRef.current.firstElementChild);
      pdfRef.current.firstElementChild.setAttribute("data-loaded", "true");
      window.scrollTo(0, 0);
    }
    setPreferences(updatedPreferences);
    savePreferences(updatedPreferences);
  }

  function exitViewer() {
    window.removeEventListener("scroll", memoizedScrollHandler);
    history.push({ pathname: "/" });
  }

  function savePreferences(preferences) {
    localStorage.setItem("viewer-preferences", JSON.stringify(preferences));
  }

  if (state?.error) {
    return <NoFileNotice/>;
  }
  return (
    <>
      {state?.filePreviewVisible && (
        <FilePreview file={state.file} notification={fileLoadMessage}
          dismissNotification={hideFileLoadMessage}
          handleFileUpload={handleFileUpload}
          loadPreviewFile={loadPreviewFile}/>
      )}
      {state?.instance && (
        <>
          <Toolbar file={state.file}
            preferences={preferences}
            zoomOut={zoomOut}
            zoomIn={zoomIn}
            previousPage={previousPage}
            nextPage={nextPage}
            handleSelect={handleSelect}
            scrollToNewPage={scrollToNewPage}
            updateSettings={updateSettings}
            changeViewMode={changeViewMode}
            exitViewer={exitViewer}/>
          {fileLoadMessage && (
            <DropModal message={fileLoadMessage}
              preferences={preferences}
              saveDroppedFile={saveDroppedFile}
              hideDropModal={hideDropModal}
              dismissNotification={hideFileLoadMessage}/>
          )}
        </>
      )}
      <div className={`viewer-pdf${settings.invertColors ? " invert" : ""}`} ref={pdfRef}></div>
      {preferences.viewMode === "single" && (
        <>
          <button className="btn icon-btn viewer-navigation-btn previous" onClick={previousPage}>
            <Icon name="chevron-left"/>
          </button>
          <button className="btn icon-btn viewer-navigation-btn next" onClick={nextPage}>
            <Icon name="chevron-right"/>
          </button>
        </>
      )}
    </>
  );
}
