import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { computeHash, setDocumentTitle } from "utils";
import { useUser } from "contexts/user-context";
import * as fileService from "services/fileService";
import * as settingsService from "services/settingsService";
import * as fileWarningService from "services/fileWarningService";
import ErrorPage from "components/ErrorPage";
import Modal from "components/Modal";
import Icon from "components/Icon";
import "./viewer.css";
import FilePreview from "./FilePreview";
import Toolbar from "./Toolbar";
import FileLoadModal from "./FileLoadModal";
import Spinner from "./Spinner";

export default function Viewer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { id } = useParams();
  const [state, setState] = useState({});
  const [fileWarning, setFileWarning] = useState(() => fileWarningService.getSettings());
  const [settings, setSettings] = useState(() => settingsService.getSettings());
  const [fileLoadMessage, setFileLoadMessage] = useState(null);
  const [marginModal, setMarginModal] = useState(null);
  const viewerRef = useRef(null);
  const viewerState = useRef(0);
  const memoizedDropHandler = useCallback(handleDrop, [state, fileWarning, fileLoadMessage]);

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
      if (location.pathname === "/") {
        cleanupViewer();
      }
    };
  }, [state.file, location.pathname]);

  useEffect(() => {
    window.addEventListener("drop", memoizedDropHandler);
    window.addEventListener("dragover", handleDragover);

    return () => {
      window.removeEventListener("drop", memoizedDropHandler);
      window.removeEventListener("dragover", handleDragover);
    };
  }, [memoizedDropHandler]);

  useEffect(() => {
    if (!state.file || state.filePreviewVisible) {
      return;
    }

    if (state.file) {
      viewerRef.current.classList.add("offset");
    }
    initViewer(viewerRef.current, {
      blob: state.currentFile,
      metadata: state.file,
      save: state.save
    });
  }, [state.filePreviewVisible, state.file]);

  async function init() {
    if (state.reload || viewerState.current) {
      return;
    }
    viewerState.current = 1;

    const type = new URLSearchParams(location.search).get("type") || "";
    const file = await fileService.fetchFile(id, user.id, type);

    if (file?.id) {
      const currentFile = await fileService.fetchCurrentFile(file.hash);
      file.type = file.type || "pdf";

      if (currentFile && currentFile.name === file.name) {
        setState({ file, currentFile });
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
    viewerState.current = 2;
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
        setState({ file: state.file, currentFile: file });
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
        if (fileWarning.hide) {
          save = fileWarning.saveFile;
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

      if (save) {
        fileService.saveFile(newFile, user.id);
      }
    }

    if (viewerState.current) {
      cleanupViewer(true);
    }
    navigate(`/viewer/${newFile.id}`, { replace: true });
    setDocumentTitle(newFile.name);
    setState({ file: newFile, currentFile: file, reload: true, save: false });
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
    fileService.saveCurrentFile(metadata.hash, blob);
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

  function hideFileLoadModal(settings) {
    setSaveViewerFile(settings.saveFile);
    setFileWarning(settings);
    hideFileLoadMessage();
  }

  function updateFileSaveSetting({ target }) {
    const settings = {
      ...fileWarning,
      saveFile: target.checked
    };

    setFileWarning(settings);
    fileWarningService.setSettings(settings);
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
        <FilePreview file={state.file} user={user} loading={state.loading} notification={fileLoadMessage}
          dismissNotification={hideFileLoadMessage}
          handleFileUpload={handleFileUpload}
          loadPreviewFile={loadPreviewFile}/>
      ) : fileLoadMessage ? (
        <FileLoadModal message={fileLoadMessage}
          fileWarning={fileWarning}
          saveFileLoadModalFile={saveFileLoadModalFile}
          hideFileLoadModal={hideFileLoadModal}
          hideFileLoadMessage={hideFileLoadMessage}/>
      ) : null}
      {state.file && !state.filePreviewVisible && (
        <>
          <Toolbar file={state.file}
            settings={settings}
            fileWarning={fileWarning}
            setViewerSettings={setViewerSettings}
            updateFileSaveSetting={updateFileSaveSetting}
            handleFileUpload={handleFileUpload}
            showMarginModal={showMarginModal}
            exitViewer={exitViewer}/>
          {state.loading && <Spinner/>}
        </>
      )}
      <div id="js-viewer" className="viewer offset" ref={viewerRef}></div>
      <div id="js-viewer-outline" className="viewer-outline-container"></div>
      <button id="js-viewer-nav-previous-btn" className="btn icon-btn viewer-navigation-btn previous">
        <Icon id="chevron-left"/>
      </button>
      <button id="js-viewer-nav-next-btn" className="btn icon-btn viewer-navigation-btn next">
        <Icon id="chevron-right"/>
      </button>
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
