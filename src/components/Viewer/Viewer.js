import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useHistory, useParams } from "react-router-dom";
import { setDocumentTitle } from "../../utils";
import { fetchIDBFiles, saveFile, fetchIDBFile } from "../../services/fileIDBService";
import { fetchCurrentFile, saveCurrentFile } from "../../services/currentFileIDBService";
import { getSettings } from "../../services/settingsService";
import Icon from "../Icon";
import FilePreview from "./FilePreview";
import Toolbar from "./Toolbar";
import FileLoadModal from "./FileLoadModal";
import NoFileNotice from "./NoFileNotice";
import Spinner from "./Spinner";
import { initPdfViewer, cleanupPdfViewer, getNewPdfFile, setSavePdfFile } from "./pdf-viewer";
import { initEpubViewer, cleanupEpubViewer, setSaveEpubFile, getNewEpubFile } from "./epub-viewer";
import "./viewer.scss";

export default function Viewer() {
  const history = useHistory();
  const { id } = useParams();
  const [state, setState] = useState({});
  const [filePreferences, setFilePreferences] = useState(() => initPreferences());
  const [settings, setSettings] = useState(() => getSettings());
  const [fileLoadMessage, setFileLoadMessage] = useState(null);
  const viewerRef = useRef(null);
  const viewerLoaded = useRef(false);
  const memoizedDropHandler = useCallback(handleDrop, [state, filePreferences, fileLoadMessage]);

  useLayoutEffect(() => cleanupViewer(), []);

  useLayoutEffect(() => {
    init();
  }, [id]);

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
    const file = await fetchIDBFile(id);

    if (file) {
      const currentFile = await fetchCurrentFile();
      file.type ||= "pdf";

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

  function initViewer(container, file) {
    viewerLoaded.current = true;
    file.metadata.type ||= "pdf";

    if (file.metadata.type === "pdf") {
      initPdfViewer(container, file);
    }
    else if (file.metadata.type === "epub") {
      initEpubViewer(container, file);
    }
  }

  function cleanupViewer() {
    if (!state.file) {
      return;
    }

    if (state.file.type === "pdf") {
      cleanupPdfViewer();
    }
    else if (state.file.type === "epub") {
      cleanupEpubViewer();
    }
  }

  function reloadViewer(container, file) {
    if (viewerLoaded.current) {
      cleanupViewer();
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

    if (file.name === state.file.name) {
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

    let newFile = await findFile(file);
    let save = true;

    if (!newFile) {
      const fileType = file.name.slice(file.name.lastIndexOf(".") + 1);

      if (fileType === "pdf") {
        newFile = await getNewPdfFile(file);
      }
      else if (fileType === "epub") {
        newFile = await getNewEpubFile(file);
      }

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
    saveFile(metadata);
    saveCurrentFile(blob);
  }

  function setSaveViewerFile(save) {
    if (state.file.type === "pdf") {
      setSavePdfFile(save);
    }
    else if (state.file.type === "epub") {
      setSaveEpubFile(save);
    }
  }

  async function findFile(file) {
    const files = await fetchIDBFiles();
    return files.find(({ name }) => name === file.name);
  }

  function hideFileLoadMessage() {
    setFileLoadMessage(null);
  }

  function hideFileLoadModal(preferences) {
    setSaveViewerFile(preferences.saveLoadedFile);
    setFilePreferences(preferences);
    hideFileLoadMessage();
  }

  function initPreferences() {
    return JSON.parse(localStorage.getItem("file-preferences")) || {};
  }

  function savePreferences(preferences) {
    localStorage.setItem("file-preferences", JSON.stringify(preferences));
  }

  function updateFileSavePreference({ target }) {
    const updatedPreferences = {
      ...filePreferences,
      saveLoadedFile: target.checked
    };

    setFilePreferences(updatedPreferences);
    savePreferences(updatedPreferences);
  }

  function setViewerSettings(name, value) {
    setSettings({ ...settings, [name]: value });
  }

  function exitViewer() {
    history.push({ pathname: "/" });
    cleanupViewer();
  }

  if (state.error) {
    return <NoFileNotice/>;
  }
  return (
    <>
      {state.filePreviewVisible ? (
        <FilePreview file={state.file} loading={state.loading} notification={fileLoadMessage}
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
            exitViewer={exitViewer}/>
          {state.loading && <Spinner/>}
        </>
      )}
      <div className={`viewer-pdf offset${settings.invertColors ? " invert" : ""}`} ref={viewerRef}></div>
      <div id="js-viewer-outline" className="viewer-outline"></div>
      <button id="js-viewer-nav-previous-btn" className="btn icon-btn viewer-navigation-btn previous">
        <Icon name="chevron-left"/>
      </button>
      <button id="js-viewer-nav-next-btn" className="btn icon-btn viewer-navigation-btn next">
        <Icon name="chevron-right"/>
      </button>
    </>
  );
}
