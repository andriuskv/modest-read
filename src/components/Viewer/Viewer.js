import React, { useState, useEffect, useRef, useCallback } from "react";
import { useHistory, useParams } from "react-router-dom";
import * as pdfjs from "pdfjs-dist/webpack";
import { v4 as uuidv4 } from "uuid";
import { setDocumentTitle, pageToDataURL, getPdfInstance, parseMetadata, getPageElementBox, scrollToPage } from "../../utils";
import { fetchIDBFiles, saveFile, fetchIDBFile } from "../../services/fileIDBService";
import { fetchCurrentFile, saveCurrentFile } from "../../services/currentFileIDBService";
import { getSettings } from "../../services/settingsService";
import LinkService from "../../services/viewerLinkService";
import FilePreview from "./FilePreview";
import Toolbar from "./Toolbar";
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
  const pdfRef = useRef(null);
  const pageRendering = useRef(false);
  const pendingPages = useRef([]);
  const observer = useRef(null);
  const scrollTimeout = useRef(0);
  const updatingPageNumber = useRef(false);
  const updatingPages = useRef(false);
  const scrollDirection = useRef(0);
  const ctrlPressed = useRef(false);
  const memoizedScrollHandler = useCallback(handleScroll, [scale]);
  const memoizedWheelHandler = useCallback(handleWheel, [scale]);
  const memoizedKeyUpHandler = useCallback(handleKeyUp, [scale]);
  const memoizedKeyDownHandler = useCallback(handleKeyDown, [scale, pageNumber]);

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
    window.addEventListener("scroll", memoizedScrollHandler);
    window.addEventListener("wheel", memoizedWheelHandler, { passive: false });
    window.addEventListener("keyup", memoizedKeyUpHandler);

    return () => {
      window.removeEventListener("scroll", memoizedScrollHandler);
      window.removeEventListener("wheel", memoizedWheelHandler, { passive: false });
      window.removeEventListener("keyup", memoizedKeyUpHandler);
    };
  }, [memoizedScrollHandler, memoizedWheelHandler, memoizedKeyUpHandler]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener("keydown", memoizedKeyDownHandler);

    return () => {
      window.removeEventListener("keydown", memoizedKeyDownHandler);
    };
  }, [memoizedKeyDownHandler]);

  useEffect(() => {
    if (!state || !state.instance) {
      return;
    }
    function updatePages(scaleValue) {
      for (const [index, element] of Object.entries(pdfRef.current.children)) {
        const pageDimension = state.pageDimensions[index];
        const w = Math.floor(pageDimension.width * scaleValue);
        const h = Math.floor(pageDimension.height * scaleValue);

        element.style.width = `${w}px`;
        element.style.height = `${h}px`;

        if (element.hasAttribute("data-loaded")) {
          const canvas = element.firstElementChild;
          const { width } = canvas;

          if (w === width) {
            canvas.style.width = "";
            canvas.style.height = "";
            element.removeAttribute("data-rerender-needed");
          }
          else {
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            element.setAttribute("data-rerender-needed", true);
          }
        }
      }
    }

    function updatePagesWithNewScale(newScale) {
      const scrollLeft = document.documentElement.scrollLeft;
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
      saveFile(state.file);
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

    async function renderPageContent(container) {
      const number = parseInt(container.getAttribute("data-page-number"), 10);
      const pageDimension = state.pageDimensions[number - 1];
      const w = Math.floor(pageDimension.width * scale.currentScale);
      const h = Math.floor(pageDimension.height * scale.currentScale);
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

      canvas.width = w % 2 === 0 ? w : w + 1;
      canvas.height = h + 1;
      textLayerDiv.style.width = `${w}px`;
      textLayerDiv.style.height = `${h}px`;

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
  }, [scale]); // eslint-disable-line react-hooks/exhaustive-deps

  async function init() {
    if (history.location.state) {
      return;
    }
    const file = await fetchIDBFile(id);

    if (file) {
      const currentFile = await fetchCurrentFile();

      if (file.scale.value) {
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

      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        saveFile(state.file);
      }, 1000);

      if (state.file.pageNumber !== oldPageNumber) {
        setPageNumber(state.file.pageNumber);
        setState({ ...state });
      }
      updatingPageNumber.current = false;
    });
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

    if (!annotations.length) {
      return;
    }
    const annotationLayerDiv = container.children[2];
    const params = {
      page,
      annotations,
      viewport: viewport.clone({ dontFlip: true }),
      div: annotationLayerDiv,
      linkService: new LinkService(state.instance, pdfRef.current, window.location.href)
    };

    if (annotationLayerDiv) {
      pdfjs.AnnotationLayer.update(params);
    }
    else {
      const div = document.createElement("div");
      div.className = "viewer-annotation-layer";
      container.appendChild(div);
      params.div = div;
      pdfjs.AnnotationLayer.render(params);
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

  async function renderEmptyPage(i, scale, fragmenet, pdf) {
    const div = document.createElement("div");
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: scale.currentScale });

    div.style.width = `${Math.floor(viewport.width)}px`;
    div.style.height = `${Math.floor(viewport.height)}px`;

    div.setAttribute("data-page-number", i);
    div.classList.add("viewer-page");
    fragmenet.appendChild(div);
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

  async function loadFile(file, { fileMetadata = null, pdfInstance = null } = {}) {
    fileMetadata.scale = fileMetadata.scale || getDefaultScale();
    fileMetadata.pageNumber = fileMetadata.pageNumber || 1;
    const pdf = pdfInstance || await getPdfInstance(file, pdfjs);
    const [{ maxWidth, maxHeight }, pageDimensions] = await Promise.all([
      findBiggestDimensions(pdf, fileMetadata.pageCount),
      getPageDimensions(pdf),
      renderEmptyPages(pdf, fileMetadata.scale)
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
    saveFile(fileMetadata);
    saveCurrentFile(file);
  }

  async function loadNewFile() {
    const { file } = fileLoadMessage;
    const files = await fetchIDBFiles();
    let newFile = files.find(({ name }) => name === file.name);
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
    }
    loadFile(file, {
      fileMetadata: newFile,
      pdf
    });
    history.replace({ pathname: `/viewer/${newFile.id}`, state: true });
    setDocumentTitle(newFile.name);
  }

  async function handleFileUpload(event) {
    const [file] = event.target.files;

    if (!file.name.endsWith(".pdf")) {
      setFileLoadMessage({
        file,
        type: "negative",
        value: "File is not supported."
      });
    }
    else if (file.name !== state.file.name) {
      setFileLoadMessage({
        file,
        type: "warning",
        value: "File does not match currently loaded file.\nDo you want to load it anyway?"
      });
    }
    else {
      loadFile(file, { fileMetadata: state.file });
    }
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
    scrollToPage(pageNumber - 1, pdfRef.current.children, settings.keepToolbarVisible);
  }

  function nextPage() {
    scrollToPage(pageNumber + 1, pdfRef.current.children, settings.keepToolbarVisible);
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

  function exitViewer() {
    window.removeEventListener("scroll", memoizedScrollHandler);
    history.push({ pathname: "/" });
  }

  if (state?.error) {
    return <NoFileNotice/>;
  }
  return (
    <>
      {state?.filePreviewVisible && <FilePreview file={state.file} notification={fileLoadMessage}
        dismissNotification={hideFileLoadMessage}
        handleFileUpload={handleFileUpload}
        loadNewFile={loadNewFile}/>
      }
      {state && (
        <Toolbar file={state.file}
          zoomOut={zoomOut}
          zoomIn={zoomIn}
          previousPage={previousPage}
          nextPage={nextPage}
          handleSelect={handleSelect}
          scrollToNewPage={scrollToNewPage}
          updateSettings={updateSettings}
          exitViewer={exitViewer}/>
      )}
      <div className={`viewer-pdf${settings.invertColors ? " invert" : ""}`} ref={pdfRef}></div>
    </>
  );
}
