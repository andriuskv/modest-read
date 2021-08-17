import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { setDocumentTitle, pageToDataURL, getPdfInstance, parsePdfMetadata, getEpubCoverUrl, getFileSizeString, delay } from "../../utils";
import { useUser } from "../../context/user-context";
import * as fileService from "../../services/fileService";
import { getSettings, setSettings, setSetting } from "../../services/settingsService";
import Header from "../Header";
import Icon from "../Icon";
import Dropdown from "../Dropdown";
import ConfirmationModal from "../ConfirmationModal";
import LandingPage from "../LandingPage";
import Notification from "../Notification";
import ErrorPage from "../ErrorPage";
import FileCard from "../FileCard";
import FileCardPlaceholder from "./FileCardPlaceholder";
import FileSearch from "./FileSearch";
import FilesSort from "./FilesSort";
import "./files.scss";

export default function Files() {
  const { user } = useUser();
  const [state, setState] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [categoryMenuVisible, setCategoryMenuVisibility] = useState(null);
  const [filesLoading, setFilesLoading] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [landingPageHidden, setLandingPageHidden] = useState(() => localStorage.getItem("hide-landing-page"));
  const [modal, setModal] = useState(null);
  const memoizedDropHandler = useCallback(handleDrop, [state, files]);
  const memoizedDragoverHandler = useCallback(handleDragover, [state, files]);

  useEffect(() => {
    if (user.loading) {
      return;
    }

    if (landingPageHidden || user.email) {
      init();
    }
    else {
      window.title = "ModestRead";
      setLoading(false);
    }
  }, [user, landingPageHidden]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const filesToSave = [];
    let intervalId = 0;
    let loadingCount = 0;

    async function loadPdfFile(file) {
      const [{ default: CryptoJS }, pdf] = await Promise.all([
        import("crypto-js"),
        getPdfInstance(file.blob)
      ]);
      const [metadata, coverImage, buffer] = await Promise.all([
        pdf.getMetadata(),
        pageToDataURL(pdf),
        file.blob.arrayBuffer()
      ]);
      const wordArray = CryptoJS.lib.WordArray.create(buffer);
      const hash = CryptoJS.MD5(wordArray).toString();

      delete file.loading;
      delete file.blob;

      Object.assign(file, {
        ...parsePdfMetadata(metadata),
        coverImage,
        hash,
        viewMode: "multi",
        pageCount: pdf.numPages
      });

      setFiles([...files]);

      loadingCount -= 1;
      filesToSave.push(file);
    }

    async function loadEpubFile(file) {
      const [{ default: CryptoJS }, { default: epubjs }] = await Promise.all([
        import("crypto-js"),
        import("epubjs")
      ]);
      const book = epubjs(file.blob);

      await book.ready;

      const [metadata, coverImage, buffer] = await Promise.all([
        book.loaded.metadata,
        getEpubCoverUrl(book),
        file.blob.arrayBuffer(),
        book.locations.generate(1650)
      ]);
      const wordArray = CryptoJS.lib.WordArray.create(buffer);
      const hash = CryptoJS.MD5(wordArray).toString();

      if (metadata.title) {
        file.title = metadata.title;
      }

      if (metadata.creator) {
        file.author = metadata.creator;
      }
      file.pageCount = book.locations.length();
      file.coverImage = coverImage;
      file.viewMode = "single";
      file.hash = hash;

      delete file.loading;
      delete file.blob;

      setFiles([...files]);

      loadingCount -= 1;
      filesToSave.push(file);
    }

    async function loadFile(file) {
      loadingCount += 1;

      if (file.type === "pdf") {
        loadPdfFile(file);
      }
      else if (file.type === "epub") {
        loadEpubFile(file);
      }
    }

    async function loadFiles() {
      setImportMessage("Importing...");

      for (const file of files) {
        if (file.loading) {
          loadFile(file);
        }
      }

      intervalId = setInterval(async () => {
        if (loadingCount <= 0) {
          const files = [...filesToSave];

          loadingCount = 0;
          filesToSave.length = 0;

          clearInterval(intervalId);
          setImportMessage("Saving...");

          try {
            await fileService.saveFiles(files, user);
          } catch (e) {
            console.log(e);
            setNotification({ value: "Something went wrong. Try again later." });
          } finally {
            await delay(2000);
            setImportMessage("");
          }
        }
      }, 1000);
    }

    if (filesLoading) {
      setFilesLoading(false);
      loadFiles();
    }
  }, [filesLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener("drop", memoizedDropHandler);
    window.addEventListener("dragover", memoizedDragoverHandler);

    return () => {
      window.removeEventListener("drop", memoizedDropHandler);
      window.removeEventListener("dragover", memoizedDragoverHandler);
    };
  }, [memoizedDropHandler, memoizedDragoverHandler]);

  async function init() {
    try {
      const settings = getSettings();
      const data = await fileService.fetchFiles(settings, user);

      if (data.message) {
        setNotification({ value: data.message });
      }

      if (data.files) {
        setFiles(data.files);
        setState({
          visibleCategory: "all",
          categories: getCategories(data.files),
          sortBy: settings.sortBy,
          sortOrder: settings.sortOrder,
          type: settings.layoutType,
          showCategories: settings.showCategories
        });
        setLoading(false);
        setDocumentTitle("Files");

        if (!landingPageHidden) {
          localStorage.setItem("hide-landing-page", true);
        }
      }
    } catch (e) {
      setState({ error: true, message: "Something went wrong. Try again later." });
      console.log(e);
    }
  }

  function handleDrop(event) {
    event.preventDefault();

    if (event.dataTransfer.files.length) {
      processFiles(event.dataTransfer.files);
    }
  }

  function handleDragover(event) {
    event.preventDefault();
  }

  function processFiles(importedFiles) {
    const supportedFiles = Array.from(importedFiles).filter(file => file.name.endsWith(".pdf") || file.name.endsWith(".epub"));

    if (importedFiles.length === 1) {
      let message = "";

      if (!supportedFiles.length) {
        message = "File is not supported.";
      }
      else if (files.find(({ name }) => name === importedFiles[0].name)) {
        message = "File already exist.";
      }

      if (message) {
        setNotification({ value: message });
        setCategoryMenuVisibility(false);
        return;
      }
    }
    else if (!supportedFiles.length) {
      setNotification({ value: "No supported files found." });
      setCategoryMenuVisibility(false);
      return;
    }
    const duplicateFiles = [];
    const newFiles = [];

    for (const file of supportedFiles) {
      const foundFile = files.find(({ name }) => name === file.name);

      if (foundFile) {
        duplicateFiles.push(file.name);
      }
      else {
        const params = {};

        if (!user.email) {
          params.local = true;
        }
        newFiles.push({
          blob: file,
          id: uuidv4(),
          createdAt: Date.now(),
          name: file.name,
          size: file.size,
          type: file.name.slice(file.name.lastIndexOf(".") + 1),
          sizeString: getFileSizeString(file.size),
          ...params,
          status: "not started",
          pageNumber: 1,
          loading: true
        });
      }
    }

    if (duplicateFiles.length) {
      if (duplicateFiles.length === importedFiles.length) {
        setNotification({ value: "Files already exist." });
        setCategoryMenuVisibility(false);
        return;
      }
      else {
        setNotification({
          value: "Some of the files were not imported because they already exist.",
          files: duplicateFiles,
          expandable: true
        });
      }
    }
    const newSortedFiles = fileService.sortFiles(newFiles.concat(files), { sortBy: state.sortBy, sortOrder: state.sortOrder });

    setFiles(newSortedFiles);
    setFilesLoading(true);
    setState({
      ...state,
      categories: getCategories(newSortedFiles)
    });
    setCategoryMenuVisibility(false);

    if (notification) {
      dismissNotification();
    }
    localStorage.setItem("hide-landing-page", true);
  }

  function getCategories(files) {
    const categories = [{
      name: "All",
      id: "all",
      icon: "bookshelf",
      files: []
    },
    {
      name: "Reading",
      id: "reading",
      icon: "open-book",
      files: []
    },
    {
      name: "Planing to Read",
      id: "planing to read",
      icon: "book-question-mark",
      files: []
    },
    {
      name: "Not Started",
      id: "not started",
      icon: "book",
      files: []
    },
    {
      name: "Have Read",
      id: "have read",
      icon: "book-check-mark",
      files: []
    }];

    for (const category of categories) {
      if (category.id === "all") {
        category.files = files;
      }
      else {
        category.files = files.filter(file => file.status === category.id);
      }
    }
    return categories;
  }

  function handleFileUpload(event) {
    if (event.target.files.length) {
      processFiles(event.target.files);
    }
    event.target.value = "";
  }

  function selectCategory(category) {
    if (category !== state.visibleCategory) {
      setState({
        ...state,
        visibleCategory: category
      });

      if (categoryMenuVisible) {
        setCategoryMenuVisibility(false);
      }
    }
  }

  function changeReadingStatus(id, status) {
    const file = files.find(file => file.id === id);

    if (status === file.status) {
      return;
    }
    const params = { status };

    if (status === "reading") {
      params.accessedAt = Date.now();
    }
    updateFile(file, params);
  }

  function resetProgress(id) {
    const file = files.find(file => file.id === id);
    const params = {
      status: "not started",
      accessedAt: 0,
      pageNumber: 1
    };

    if (file.type === "pdf") {
      params.scrollLeft = 0;
      params.scrollTop = 0;
    }
    else if (file.type === "epub") {
      params.location = "";
    }
    updateFile(file, params);
    hideModal();
  }

  async function updateFile(file, params) {
    try {
      const success = await fileService.updateFile(params, {
        id: file.id,
        local: file.local,
        userId: user.id
      });

      if (success) {
        Object.assign(file, params);

        const sortedFiles = fileService.sortFiles(files, { sortBy: state.sortBy, sortOrder: state.sortOrder });

        setFiles(sortedFiles);
        setState({
          ...state,
          categories: getCategories(sortedFiles)
        });
      }
      else {
        setNotification({ value: "Could not update file. Try again later." });
      }
    } catch (e) {
      console.log(e);
      setNotification({ value: "Could not update file. Try again later." });
    }
  }

  function showResetProgressModal(id) {
    setModal({
      iconId: "reset",
      title: "Reset progress?",
      message: "Are you sure you want to reset reading progress for this file?",
      actionName: "Reset",
      action: () => resetProgress(id)
    });
  }

  async function removeFile(id) {
    try {
      const index = files.findIndex(file => file.id === id);
      const file = files[index];
      const success = await fileService.deleteFile(id, file.local, user.id);

      if (success) {
        files.splice(index, 1);
        setFiles([...files]);
        setState({
          ...state,
          categories: getCategories(files)
        });
      }
      else {
        setNotification({ value: "Could not remove file. Try again later." });
      }
      hideModal();
    } catch (e) {
      console.log(e);
      setNotification({ value: "Could not remove file. Try again later." });
    }
  }

  function showRemoveFileModal(id) {
    setModal({
      iconId: "trash",
      title: "Remove this file?",
      message: "Are you sure you want to remove this file?",
      actionName: "Remove",
      action: () => removeFile(id)
    });
  }

  async function transferFile(file) {
    const local = file.local;

    if (local) {
      delete file.local;
    }
    else {
      file.local = true;
    }

    try {
      const saved = await fileService.saveFiles([file], local ? user : {});

      if (saved) {
        const deleted = await fileService.deleteFile(file.id, !file.local, user.id);

        if (deleted) {
          setFiles([...files]);
          setState({
            ...state,
            categories: getCategories(files)
          });
          return;
        }
        return;
      }
      setNotification({ value: "Something went wrong. Try again later." });
    } catch (e) {
      console.log(e);
      setNotification({ value: "Something went wrong. Try again later." });
    } finally {
      hideModal();
    }
  }

  function showFileTransferModal(file) {
    let action = null;

    if (file.local) {
      action = {
        iconId: "cloud",
        name: "Upload",
        message: "Are you sure you want to upload this file? It will become inaccessible without internet connection."
      };
    }
    else {
      action = {
        iconId: "home",
        name: "Download",
        message: "Are you sure you want to download this file? It will become inaccessible to other devices."
      };
    }
    setModal({
      iconId: action.iconId,
      title: `${action.name} this file?`,
      message: action.message,
      actionName: action.name,
      action: () => transferFile(file)
    });
  }

  function hideModal() {
    setModal(null);
  }

  function dismissNotification() {
    setNotification(null);
  }

  function changeLayout(type) {
    if (type !== state.type) {
      setState({ ...state, type });
      setSetting("layoutType", type);
    }
  }

  function toggleCategoryNames(event) {
    const { checked } = event.target;

    setState({
      ...state,
      showCategories: checked
    });
    setSetting("showCategories", checked);
  }

  function toggleMenu() {
    setCategoryMenuVisibility(!categoryMenuVisible);
  }

  function hideMenu({ target, currentTarget }) {
    if (categoryMenuVisible && target === currentTarget) {
      setCategoryMenuVisibility(false);
    }
  }

  function hideLandingPage() {
    setLandingPageHidden(true);
    localStorage.setItem("hide-landing-page", true);
  }

  function sortFileCatalog(sortBy, sortOrder = 1) {
    if (sortBy === state.sortBy && sortOrder === state.sortOrder) {
      return;
    }
    const sortedFiles = fileService.sortFiles(files, { sortBy, sortOrder });

    setFiles(sortedFiles);
    setState({
      ...state,
      sortBy,
      sortOrder,
      categories: getCategories(sortedFiles)
    });
    setSettings({ sortBy, sortOrder });
  }

  function searchFiles(value) {
    if (value) {
      const matchedFiles = files.filter(file => {
        return file.name.toLowerCase().includes(value) ||
          file.title?.toLowerCase().includes(value) ||
          file.artist?.toLowerCase().includes(value);
      });

      setState({
        ...state,
        matchedFileCount: matchedFiles.length,
        searchCategories: matchedFiles.length ? getCategories(matchedFiles) : []
      });
    }
    else {
      resetSearch();
    }
  }

  function resetSearch() {
    delete state.matchedFileCount;
    delete state.searchCategories;

    setState({ ...state });
  }

  function renderMoreBtns() {
    return (
      <>
        <Link to="/statistics" className="btn icon-text-btn files-more-dropdown-btn">
          <Icon name="stats" size="24px"/>
          <span>Statistics</span>
        </Link>
        <label className="btn icon-text-btn dropdown-btn files-more-dropdown-btn files-import-btn">
          <Icon name="upload" size="24px"/>
          <span>Import Files</span>
          <input type="file" onChange={handleFileUpload} className="sr-only" accept="application/pdf, application/epub+zip" multiple/>
        </label>
      </>
    );
  }

  function renderCategoryMenu() {
    return (
      <div className="files-header">
        <button className="btn icon-btn files-sidebar-toggle-btn" onClick={toggleMenu} title="Toggle sidebar">
          <Icon name="menu" size="24px"/>
        </button>
        <Header shouldRenderUser={true}/>
        <div className={`files-categories-container${categoryMenuVisible ? " visible" : ""}`} onClick={hideMenu}>
          <div className="files-sidebar">
            <div className="files-sidebar-title-container">
              <span className="files-sidebar-title">ModestRead</span>
            </div>
            <ul className="files-categories">
              {state.categories.map((category, i) => (
                <li key={i}>
                  <button className={`btn icon-text-btn files-category-btn${state.visibleCategory === category.id ? " active" : ""}`}
                    onClick={() => selectCategory(category.id)}>
                    <Icon name={category.icon} size="24px"/>
                    <span>{category.name}</span>
                    <span>{category.files.length}</span>
                  </button>
                </li>
              ))}
            </ul>
            {renderMoreBtns()}
            <Dropdown
              toggle={{
                content: <Icon name="dots-vertical" size="24px"/>,
                title: "More",
                className: "btn icon-btn icon-btn-alt files-more-dropdown-toggle-btn"
              }}
              body={{ className: "files-more-dropdown" }}>
              {renderMoreBtns()}
              <div className="files-layout-setting">
                <button className={`btn icon-text-btn files-layout-setting-item${state.type === "grid" ? " active" : ""}`}
                  onClick={() => changeLayout("grid")}>
                  <Icon name="grid" size="24px"/>
                  <span>Grid</span>
                </button>
                <button className={`btn icon-text-btn files-layout-setting-item${state.type === "list" ? " active" : ""}`}
                  onClick={() => changeLayout("list")}>
                  <Icon name="list" size="24px"/>
                  <span>List</span>
                </button>
              </div>
              <label className="checkbox-container files-show-categories-setting">
                <input type="checkbox" className="sr-only checkbox-input" onChange={toggleCategoryNames}
                  checked={state.showCategories}/>
                <div className="checkbox">
                  <div className="checkbox-tick"></div>
                </div>
                <span className="checkbox-label">Show categories</span>
              </label>
            </Dropdown>
          </div>
        </div>
      </div>
    );
  }

  function renderFile(file) {
    return (
      <FileCard file={file} showLink={true} user={user} key={file.id}>
        <Dropdown
          toggle={{
            content: <Icon name="bookshelf"/>,
            title: "Set reading status",
            className: "btn icon-btn"
          }}>
          <div className="files-file-card-dropdown-group">
            <div className="files-file-card-dropdown-group-title">Set Reading Status</div>
            {state.categories.slice(1).map((category, i) => (
              <button className={`btn icon-text-btn dropdown-btn files-file-card-dropdown-btn${file.status === category.id ? " active" : ""}`} key={i}
                onClick={() => changeReadingStatus(file.id, category.id)}>
                <Icon name={category.icon}/>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </Dropdown>
        <Dropdown
          toggle={{
            content: <Icon name="dots-vertical"/>,
            title: "More",
            className: "btn icon-btn"
          }}>
          <div className="files-file-card-dropdown-group">
            {file.local ? (
              <button className="btn icon-text-btn dropdown-btn files-file-card-dropdown-btn"
                onClick={() => showFileTransferModal(file)}>
                <Icon name="cloud"/>
                <span>Upload</span>
              </button>
            ) : (
              <button className="btn icon-text-btn dropdown-btn files-file-card-dropdown-btn"
                onClick={() => showFileTransferModal(file)}>
                <Icon name="home"/>
                <span>Download</span>
              </button>
            )}
            <button className="btn icon-text-btn dropdown-btn files-file-card-dropdown-btn"
              onClick={() => showResetProgressModal(file.id)}>
              <Icon name="reset"/>
              <span>Reset Progress</span>
            </button>
            <button className="btn icon-text-btn dropdown-btn files-file-card-dropdown-btn"
              onClick={() => showRemoveFileModal(file.id)}>
              <Icon name="trash"/>
              <span>Remove File</span>
            </button>
          </div>
        </Dropdown>
      </FileCard>
    );
  }

  function renderFiles(files) {
    return (
      <ul className={`files-cards ${state.type}`}>
        {files.map(file => file.loading ? <FileCardPlaceholder key={file.id}/> : renderFile(file))}
      </ul>
    );
  }

  function renderFileCategory() {
    const categories = state.searchCategories || state.categories;

    if (state.visibleCategory === "all" && state.showCategories) {
      if (state.matchedFileCount === 0) {
        return <p className="files-category-notice">Your search term doesn't match any files.</p>;
      }
      return (
        <div>
          {categories.slice(1).map((category, i) => (
            category.files.length ? (
              <div className="files-category" key={i}>
                <h3 className="files-category-name">
                  <Icon name={category.icon} size="24px"/>
                  <span>{category.name}</span>
                </h3>
                {renderFiles(category.files)}
              </div>
            ) : null
          ))}
        </div>
      );
    }
    const { files } = categories.find(({ id }) => id === state.visibleCategory);

    if (files.length) {
      return renderFiles(files);
    }
    const { files: originalFiles, id } = state.categories.find(({ id }) => id === state.visibleCategory);

    if (state.searchCategories && originalFiles.length) {
      return <p className="files-category-notice">Your search term doesn't match any files in this category.</p>;
    }
    else if (id === "all") {
      return (
        <div className="files-category-notice">
          <p className="files-category-notice-message">You don't have any files.</p>
          <label className="btn icon-text-btn primary-btn no-files-notice-btn">
            <Icon name="upload" size="24px"/>
            <span>Import Files</span>
            <input type="file" onChange={handleFileUpload} className="sr-only" accept="application/pdf, application/epub+zip" multiple/>
          </label>
        </div>
      );
    }
    return <p className="files-category-notice">You have no files in this category.</p>;
  }

  if (loading || user.loading) {
    return null;
  }

  if (state) {
    if (state.error) {
      return <ErrorPage message={state.message}/>;
    }
    return (
      <div className="container">
        {renderCategoryMenu()}
        <div className="files-top-bar">
          <FileSearch searchFiles={searchFiles} resetSearch={resetSearch}/>
          <FilesSort sortBy={state.sortBy} sortOrder={state.sortOrder} sortFileCatalog={sortFileCatalog}/>
        </div>
        {notification && (
          <Notification notification={notification} expandable={notification.expandable}
            dismiss={dismissNotification} margin="top">
            {notification.files ? (
              <ul className="files-duplicate-files">
                {notification.files.map((file, i) => (
                  <li className="files-duplicate-file" key={i}>{file}</li>
                ))}
              </ul>
            ) : null}
          </Notification>
        )}
        {renderFileCategory()}
        {modal ? <ConfirmationModal {...modal} hide={hideModal}/> : null}
        {importMessage ? <div className="files-import-message">{importMessage}</div> : null}
      </div>
    );
  }
  return <LandingPage hide={hideLandingPage}/>;
}
