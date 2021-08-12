import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useHistory, useParams } from "react-router-dom";
import { useUser } from "../../context/user-context";
import { computeHash, setDocumentTitle } from "../../utils";
import { saveFile, fetchFile, fetchCurrentFile, saveCurrentFile, findFile } from "../../services/fileService";
import { getSettings } from "../../services/settingsService";
import Icon from "../Icon";
import ErrorPage from "../ErrorPage";
import FilePreview from "./FilePreview";
import Toolbar from "./Toolbar";
import FileLoadModal from "./FileLoadModal";
import Spinner from "./Spinner";
import { initPdfViewer, cleanupPdfViewer, getNewPdfFile, setSavePdfFile } from "./pdf-viewer";
import { initEpubViewer, cleanupEpubViewer, setSaveEpubFile, getNewEpubFile } from "./epub-viewer";
import "./viewer.scss";

export default function Viewer() {
  const { user } = useUser();
  const history = useHistory();
  const { id } = useParams();
  const [state, setState] = useState({});
  const [filePreferences, setFilePreferences] = useState(() => initPreferences());
  const [settings, setSettings] = useState(() => getSettings());
  const [fileLoadMessage, setFileLoadMessage] = useState(null);
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
    const file = await fetchFile(id, user.id, type);

    if (file?.id) {
      const currentFile = await fetchCurrentFile();
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

  function initViewer(container, file) {
    viewerLoaded.current = true;
    file.metadata.type = file.metadata.type || "pdf";

    if (file.metadata.type === "pdf") {
      initPdfViewer(container, file, user);
    }
    else if (file.metadata.type === "epub") {
      initEpubViewer(container, file, user);
    }
  }

  function cleanupViewer(reloading = false) {
    if (!state.file || state.filePreviewVisible) {
      return;
    }

    if (state.file.type === "pdf") {
      cleanupPdfViewer(reloading);
    }
    else if (state.file.type === "epub") {
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
    let newFile = await findFile(hash, user.id);
    let save = true;

    if (!newFile) {
      const fileType = file.name.slice(file.name.lastIndexOf(".") + 1);

      if (fileType === "pdf") {
        newFile = await getNewPdfFile(file, user);
      }
      else if (fileType === "epub") {
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
    saveFile(metadata, user.id);
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
    </>
  );
}
