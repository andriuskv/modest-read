import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useHistory, useParams } from "react-router-dom";
import { useUser } from "../../context/user-context";
import { computeHash, setDocumentTitle } from "../../utils";
import * as fileService from "../../services/fileService";
import { getSettings } from "../../services/settingsService";
import "./viewer.scss";
import ErrorPage from "../ErrorPage";
import Modal from "../Modal";
import Icon from "../Icon";
import FilePreview from "./FilePreview";
import Toolbar from "./Toolbar";
import FileLoadModal from "./FileLoadModal";
import Spinner from "./Spinner";

export default function Viewer() {
  const { user } = useUser();
  const history = useHistory();
  const { id } = useParams();
  const [state, setState] = useState({});
  const [filePreferences, setFilePreferences] = useState(() => fileService.getPreferences());
  const [settings, setSettings] = useState(() => getSettings());
  const [fileLoadMessage, setFileLoadMessage] = useState(null);
  const [marginModal, setMarginModal] = useState(null);
  const viewerRef = useRef(null);
  const viewerLoaded = useRef(false);
  const memoizedDropHandler = useCallback(handleDrop, [state, filePreferences, fileLoadMessage]);

  useLayoutEffect(() => {
    if (user.loading) {
      return;
    }
    init();
  }, [id, user]);

  useEffect(() => {
    if (!state.file) {
      return;
    }
    return () => {
      if (history.location.pathname === "/") {
        cleanupViewer();
      }
    };
  }, [state.file, history.location.pathname]);

  useEffect(() => {
    window.addEventListener("drop", memoizedDropHandler);
    window.addEventListener("dragover", handleDragover);

    return () => {
      window.removeEventListener("drop", memoizedDropHandler);
      window.removeEventListener("dragover", handleDragover);
    };
  }, [memoizedDropHandler]);

  useEffect(() => {
    if (!state.file) {
      return;
    }

    if (state.file.viewMode === "single" && state.file.type === "pdf") {
      const media = matchMedia("only screen and (hover: none) and (pointer: coarse)");

      if (media.matches && !settings.keepToolbarVisible) {
        viewerRef.current.classList.remove("offset");
        return;
      }
    }
    viewerRef.current.classList.add("offset");
  }, [settings.keepToolbarVisible, state.file]);

  async function init() {
    if (history.location.state) {
      return;
    }
    const type = new URLSearchParams(history.location.search).get("type") || "";
    const file = await fileService.fetchFile(id, user.id, type);

    if (file?.id) {
      const currentFile = await fileService.fetchCurrentFile();
      file.type = file.type || "pdf";

      if (currentFile && currentFile.name === file.name) {
        initViewer(viewerRef.current, {
          blob: currentFile,
          metadata: file
        });
        setState({ file });
      }
      else {
        setState({ file, filePreviewVisible: true });
      }
      setDocumentTitle(file.name);
    }
    else {
      setState({ error: true });
      setDocumentTitle("Error");
    }
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

  function handleFileUpload(event) {
    const [file] = event.target.files;

    uploadFile(file);
    event.target.value = "";
  }

  async function initViewer(container, file) {
    viewerLoaded.current = true;
    file.metadata.type = file.metadata.type || "pdf";

    if (file.metadata.type === "pdf") {
      const { initPdfViewer } = await import("./pdf-viewer");

      initPdfViewer(container, file, user);
    }
    else if (file.metadata.type === "epub") {
      const { initEpubViewer } = await import("./epub-viewer");

      initEpubViewer(container, file, user);
    }
  }

  async function cleanupViewer(reloading = false) {
    if (!state.file || state.filePreviewVisible) {
      return;
    }

    if (state.file.type === "pdf") {
      const { cleanupPdfViewer } = await import("./pdf-viewer");

      cleanupPdfViewer(reloading);
    }
    else if (state.file.type === "epub") {
      const { cleanupEpubViewer } = await import("./epub-viewer");

      cleanupEpubViewer(reloading);
    }
  }

  function reloadViewer(container, file) {
    if (viewerLoaded.current) {
      cleanupViewer(true);
    }
    initViewer(container, file);
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
        initViewer(viewerRef.current, {
          blob: file,
          metadata: state.file,
          save: true
        });
        hideFileLoadMessage();
        setState({ file: state.file });
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
    let newFile = await fileService.findFile(hash, user.id);
    let save = true;

    if (!newFile) {
      const fileType = file.name.slice(file.name.lastIndexOf(".") + 1);

      if (fileType === "pdf") {
        const { getNewPdfFile } = await import("./pdf-viewer");
        newFile = await getNewPdfFile(file, user);
      }
      else if (fileType === "epub") {
        const { getNewEpubFile } = await import("./epub-viewer");
        newFile = await getNewEpubFile(file, user);
      }
      newFile.hash = hash;

      if (!state.filePreviewVisible) {
        if (filePreferences.hideWarning) {
          save = filePreferences.saveLoadedFile;
        }
        else {
          save = false;

          setFileLoadMessage({
            file,
            type: "warning",
            value: "Do you want to save this file?"
          });
        }
      }
    }
    reloadViewer(viewerRef.current, {
      metadata: newFile,
      blob: file,
      save
    });
    history.replace({ pathname: `/viewer/${newFile.id}`, state: true });
    setDocumentTitle(newFile.name);
    setState({ file: newFile });
  }

  function loadPreviewFile() {
    loadNewFile(fileLoadMessage);
    hideFileLoadMessage();
  }

  function saveFileLoadModalFile(preferences) {
    saveLoadedFile(fileLoadMessage.file, state.file);
    hideFileLoadModal(preferences);
  }

  function saveLoadedFile(blob, metadata) {
    fileService.saveFile(metadata, user.id);
    fileService.saveCurrentFile(blob);
  }

  async function setSaveViewerFile(save) {
    if (state.file.type === "pdf") {
      const { setSavePdfFile } = await import("./pdf-viewer");

      setSavePdfFile(save);
    }
    else if (state.file.type === "epub") {
      const { setSaveEpubFile } = await import("./epub-viewer");

      setSaveEpubFile(save);
    }
  }

  function hideFileLoadMessage() {
    setFileLoadMessage(null);
  }

  function hideFileLoadModal(preferences) {
    setSaveViewerFile(preferences.saveLoadedFile);
    setFilePreferences(preferences);
    hideFileLoadMessage();
  }

  function updateFileSavePreference({ target }) {
    const updatedPreferences = {
      ...filePreferences,
      saveLoadedFile: target.checked
    };

    setFilePreferences(updatedPreferences);
    fileService.savePreferences(updatedPreferences);
  }

  function setViewerSettings(name, value) {
    setSettings({ ...settings, [name]: value });
  }

  function showMarginModal() {
    setMarginModal(filePreferences.epub.margin);
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

    filePreferences.epub.margin = margin;

    event.preventDefault();
    setFilePreferences({ ...filePreferences });
    updateEpubMargin(margin);
    hideMarginModal();
  }

  function exitViewer() {
    history.push({ pathname: "/" });
    cleanupViewer();
  }

  if (state.error) {
    return <ErrorPage message={"File not found."} link={{ path: "/", iconId: "bookshelf", text: "Back to files" }}/>;
  }
  return (
    <>
      {state.filePreviewVisible ? (
        <FilePreview file={state.file} user={user} loading={state.loading} notification={fileLoadMessage}
          dismissNotification={hideFileLoadMessage}
          handleFileUpload={handleFileUpload}
          loadPreviewFile={loadPreviewFile}/>
      ) : fileLoadMessage ? (
        <FileLoadModal message={fileLoadMessage}
          filePreferences={filePreferences}
          saveFileLoadModalFile={saveFileLoadModalFile}
          hideFileLoadModal={hideFileLoadModal}
          hideFileLoadMessage={hideFileLoadMessage}/>
      ) : null}
      {state.file && !state.filePreviewVisible && (
        <>
          <Toolbar file={state.file}
            filePreferences={filePreferences}
            setViewerSettings={setViewerSettings}
            updateFileSavePreference={updateFileSavePreference}
            handleFileUpload={handleFileUpload}
            showMarginModal={showMarginModal}
            exitViewer={exitViewer}/>
          {state.loading && <Spinner/>}
        </>
      )}
      <div id="js-viewer" className="viewer offset" ref={viewerRef}></div>
      <div id="js-viewer-outline" className="viewer-outline-container"></div>
      <button id="js-viewer-nav-previous-btn" className="btn icon-btn viewer-navigation-btn previous">
        <Icon name="chevron-left"/>
      </button>
      <button id="js-viewer-nav-next-btn" className="btn icon-btn viewer-navigation-btn next">
        <Icon name="chevron-right"/>
      </button>
      {marginModal && (
        <Modal hide={hideMarginModal}>
          <form onSubmit={handleMarginFormSubmit}>
            <div className="modal-title-container">
              <Icon name="margin" className="modal-title-icon viewer-margin-modal-icon"/>
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
