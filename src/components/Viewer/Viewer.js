import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { computeHash, setDocumentTitle } from "utils";
import { useUser } from "contexts/user-context";
import * as fileService from "services/fileService";
import * as settingsService from "services/settingsService";
import ErrorPage from "components/ErrorPage";
import Modal from "components/Modal";
import Icon from "components/Icon";
import "./viewer.css";
import FilePreview from "./FilePreview";
import Toolbar from "./Toolbar";
import Spinner from "./Spinner";

export default function Viewer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { id } = useParams();
  const [state, setState] = useState({ loading: true });
  const [settings, setSettings] = useState(() => settingsService.getSettings());
  const [fileLoadMessage, setFileLoadMessage] = useState(null);
  const [marginModal, setMarginModal] = useState(null);
  const viewerRef = useRef(null);
  const viewerState = useRef(0);
  const firstFileLoaded = useRef(false);
  const fileHandleRetries = useRef(0);

  useLayoutEffect(() => {
    if (user.loading) {
      return;
    }

    if (id === "open" && !firstFileLoaded.current) {
      initFileHandle();
    }
    else {
      init();
    }

    return () => {
      const element = document.querySelector("meta[name=viewport]");
      element.content = "width=device-width, initial-scale=1, minimum-scale=1";
    };
  }, [id, user]);

  useEffect(() => {
    if (!state.file) {
      return;
    }

    if (state.loading && !state.filePreviewVisible) {
      initViewer(viewerRef.current, {
        blob: state.currentFile,
        metadata: state.file
      });
    }
    window.addEventListener("files", handleFileUpload);

    return () => {
      window.removeEventListener("files", handleFileUpload);
    };
  }, [state.filePreviewVisible, state.file]);

  function initFileHandle() {
    const files = fileService.getFileCache();
    firstFileLoaded.current = true;

    if (files.length) {
      loadNewFile({ file: files[0] });
    }
    // Edge case when app is in files view and file is opened through file manager.
    else if (fileHandleRetries.current < 4) {
      setTimeout(() => {
        initFileHandle();
      }, 100 * 2 ** fileHandleRetries.current);
      fileHandleRetries.current += 1;
    }
    else {
      fileHandleRetries.current = 0;
      window.addEventListener("files", initFileHandle, { once: true });
      setState({ error: true });
      setDocumentTitle("Error");
    }
  }

  async function init() {
    if (state.reload || viewerState.current) {
      return;
    }
    firstFileLoaded.current = true;
    viewerState.current = 1;

    const type = new URLSearchParams(location.search).get("type") || "";
    const file = await fileService.fetchFile(id, user.id, type);

    if (file?.id) {
      const cachedFile = await fileService.fetchCachedFile(file.hash);
      file.type = file.type || "pdf";

      if (cachedFile && cachedFile.name === file.name) {
        setState({ file, currentFile: cachedFile, loading: true });
      }
      else {
        setState({ file, filePreviewVisible: true });
      }

      if (file.title && file.author) {
        setDocumentTitle(`${file.title} by ${file.author}`);
      }
      else {
        setDocumentTitle(file.name);
      }
      setViewportMetaTag();
    }
    else {
      setState({ error: true });
      setDocumentTitle("Error");
    }
  }

  function updateTitleBarColor(toolbarVisible = settings.toolbarVisible) {
    if (toolbarVisible) {
      setTitleBarColor("#2d2c30");
    }
    else if (state.file?.type === "pdf") {
      setTitleBarColor();
    }
    else {
      const colors = {
        black: "black",
        white: "white",
        grey: "#1d1c1b",
        orange: "#fbf0d9"
      };
      setTitleBarColor(colors[settings.epub.theme]);
    }
  }

  function setViewportMetaTag() {
    const isTouchDevice = !window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const element = document.querySelector("meta[name=viewport]");

    if (isTouchDevice) {
      element.content = "width=device-width, user-scalable=no";
    }
    else {
      element.content = "width=device-width, initial-scale=1, minimum-scale=1";
    }
  }

  function handleFileUpload(event) {
    if (id === "open") {
      return;
    }
    const [file] = event.detail;

    uploadFile(file);
  }

  async function initViewer(container, file) {
    viewerState.current = 2;
    file.metadata.type = file.metadata.type || "pdf";

    container.classList.add("visible");

    if (file.metadata.type === "pdf") {
      const { initPdfViewer } = await import("./pdf-viewer");

      await initPdfViewer(container, file, user);
    }
    else if (file.metadata.type === "epub") {
      const { initEpubViewer } = await import("./epub-viewer");

      await initEpubViewer(container, file, user);
    }
    delete state.loading;
    setState({ ...state });
    updateTitleBarColor();
  }

  async function cleanupViewer(reloading = false) {
    if (!state.file || state.filePreviewVisible) {
      return;
    }

    if (!reloading) {
      fileService.resetFileCache();
    }

    if (state.file.type === "pdf") {
      const { cleanupPdfViewer } = await import("./pdf-viewer");

      cleanupPdfViewer(reloading);
    }
    else if (state.file.type === "epub") {
      const { cleanupEpubViewer } = await import("./epub-viewer");

      cleanupEpubViewer(reloading);
    }
    setTitleBarColor();
  }

  function setTitleBarColor(color = "#232225") {
    const element = document.querySelector("meta[name=theme-color]");
    element.content = color;
  }

  async function uploadFile(file) {
    if (!state.file) {
      return;
    }

    if (!["pdf", "epub"].includes(state.file.type)) {
      setFileLoadMessage({
        type: "negative",
        value: "File format is not supported.",
        duration: 4000
      });
      return;
    }
    const hash = await computeHash(await file.arrayBuffer());

    if (hash === state.file.hash) {
      if (state.filePreviewVisible) {
        hideFileLoadMessage();
        setState({ file: state.file, currentFile: file, loading: true });
        fileService.cacheFile(hash, file);
      }
      else {
        setFileLoadMessage({
          type: "negative",
          value: "File is already loaded.",
          duration: 4000
        });
      }
    }
    else if (state.filePreviewVisible) {
      setFileLoadMessage({
        file,
        type: "warning",
        value: "File does not match currently loaded file.\nDo you want to load it anyway?"
      });
    }
    else {
      loadNewFile({ file });
    }
  }

  async function loadNewFile({ file }) {
    setState({ ...state, loading: true });

    const hash = await computeHash(await file.arrayBuffer());
    let fileMetadata = await fileService.findFile(hash, user.id);

    if (!fileMetadata) {
      const fileType = file.name.slice(file.name.lastIndexOf(".") + 1);

      if (fileType === "pdf") {
        const { getNewPdfFile } = await import("./pdf-viewer");
        fileMetadata = await getNewPdfFile(file, user);
      }
      else if (fileType === "epub") {
        const { getNewEpubFile } = await import("./epub-viewer");
        fileMetadata = await getNewEpubFile(file, user);
      }
      fileMetadata.hash = hash;

      saveLoadedFile(file, fileMetadata);
    }
    else {
      fileService.cacheFile(hash, file);
    }

    if (viewerState.current) {
      await cleanupViewer(true);
    }
    navigate(`/viewer/${fileMetadata.id}${fileMetadata.local ? "?type=local" : ""}`, { replace: true });

    if (fileMetadata.title && fileMetadata.author) {
      setDocumentTitle(`${fileMetadata.title} by ${fileMetadata.author}`);
    }
    else {
      setDocumentTitle(fileMetadata.name);
    }
    setViewportMetaTag();
    setState({ file: fileMetadata, currentFile: file, reload: true, loading: true });
  }

  function loadPreviewFile() {
    loadNewFile(fileLoadMessage);
    hideFileLoadMessage();
  }

  function saveLoadedFile(blob, metadata) {
    fileService.saveFile(metadata, user.id);
    fileService.cacheFile(metadata.hash, blob);
  }

  function hideFileLoadMessage() {
    setFileLoadMessage(null);
  }

  function setViewerSettings(name, value) {
    setSettings({ ...settings, [name]: value });
  }

  function showMarginModal() {
    setMarginModal(settings.epub.margin);
  }

  function hideMarginModal() {
    setMarginModal(null);
  }

  async function handleMarginFormSubmit(event) {
    const { updateEpubMargin } = await import("./epub-viewer");
    const { horizontal, top, bottom } = event.target.elements;
    const margin = {
      horizontal: horizontal.value < 0 ? 0 : horizontal.value,
      top: top.value < 0 ? 0 : top.value,
      bottom: bottom.value < 0 ? 0 : bottom.value
    };

    settings.epub.margin = margin;

    event.preventDefault();

    setSettings({ ...settings });
    updateEpubMargin(margin);
    hideMarginModal();
    settingsService.setSettings(settings);
  }

  function exitViewer() {
    navigate("/");
    cleanupViewer();
  }

  if (state.error) {
    return <ErrorPage message={"File not found."} link={{ path: "/", iconId: "bookshelf", text: "Back to files" }}/>;
  }
  return (
    <>
      {state.filePreviewVisible ? (
        <FilePreview file={state.file} user={user} notification={fileLoadMessage}
          dismissNotification={hideFileLoadMessage}
          loadPreviewFile={loadPreviewFile}/>
      ) : null}
      {state.file && !state.filePreviewVisible && (
        <>
          <Toolbar file={state.file}
            settings={settings}
            updateTitleBarColor={updateTitleBarColor}
            setViewerSettings={setViewerSettings}
            showMarginModal={showMarginModal}
            exitViewer={exitViewer}/>
        </>
      )}
      {state.loading && <Spinner/>}
      <div id="js-viewer" className="viewer" ref={viewerRef}></div>
      <div id="js-viewer-outline" className="viewer-outline-container"></div>
      {marginModal && (
        <Modal hide={hideMarginModal}>
          <form onSubmit={handleMarginFormSubmit}>
            <div className="modal-title-container">
              <Icon id="margin" className="modal-title-icon viewer-margin-modal-icon"/>
              <h3 className="modal-title">Margin</h3>
            </div>
            <div className="viewer-margin-modal-body">
              <label>
                <div className="viewer-margin-modal-label">Horizontal</div>
                <input type="number" className="input viewer-margin-modal-input" name="horizontal" defaultValue={marginModal.horizontal}/>
              </label>
              <label>
                <div className="viewer-margin-modal-label">Top</div>
                <input type="number" className="input viewer-margin-modal-input" name="top" defaultValue={marginModal.top}/>
              </label>
              <label>
                <div className="viewer-margin-modal-label">Bottom</div>
                <input type="number" className="input viewer-margin-modal-input" name="bottom" defaultValue={marginModal.bottom}/>
              </label>
            </div>
            <div className="modal-bottom">
              <button type="button" className="btn btn-text" onClick={hideMarginModal}>Cancel</button>
              <button className="btn">Done</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
