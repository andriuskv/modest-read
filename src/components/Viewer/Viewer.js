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
import { initViewer, cleanupViewer, reloadViewer, getNewFile, setSaveViewerFile } from "./pdf-viewer";
import "./viewer.scss";

export default function Viewer() {
  const history = useHistory();
  const { id } = useParams();
  const [state, setState] = useState({});
  const [filePreferences, setFilePreferences] = useState(() => initPreferences());
  const [settings, setSettings] = useState(() => getSettings());
  const [fileLoadMessage, setFileLoadMessage] = useState(null);
  const pdfRef = useRef(null);
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
    if (settings.viewMode === "single") {
      const media = matchMedia("only screen and (hover: none) and (pointer: coarse)");

      if (media.matches && !settings.keepToolbarVisible) {
        pdfRef.current.classList.remove("offset");
        return;
      }
    }
    pdfRef.current.classList.add("offset");
  }, [settings.viewMode, settings.keepToolbarVisible]);

  async function init() {
    if (history.location.state) {
      return;
    }
    const file = await fetchIDBFile(id);

    if (file) {
      const currentFile = await fetchCurrentFile();

      if (currentFile && currentFile.name === file.name) {
        initViewer(pdfRef.current, {
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

  async function uploadFile(file) {
    if (!file.name.endsWith(".pdf")) {
      setFileLoadMessage({
        type: "negative",
        value: "File format is not supported.",
        duration: 4000
      });
    }
    else if (file.name === state.file.name) {
      if (state.filePreviewVisible) {
        initViewer(pdfRef.current, {
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
    let newFile = await findFile(file);
    let save = true;

    if (!newFile) {
      newFile = await getNewFile(file);

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
    setSaveViewerFile(save);
    reloadViewer(pdfRef.current, {
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
        <FilePreview file={state.file} notification={fileLoadMessage}
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
      {state.file && !state.filePreviewVisible && <Toolbar file={state.file}
        filePreferences={filePreferences}
        setViewerSettings={setViewerSettings}
        updateFileSavePreference={updateFileSavePreference}
        handleFileUpload={handleFileUpload}
        exitViewer={exitViewer}/>}
      <div className={`viewer-pdf offset${settings.invertColors ? " invert" : ""}`} ref={pdfRef}></div>
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
