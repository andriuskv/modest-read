import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { setDocumentTitle, pageToDataURL, getPdfInstance, parsePdfMetadata, getEpubCoverUrl, getFileSizeString } from "../../utils";
import { fetchIDBFiles, saveFile, deleteIDBFile, sortFiles } from "../../services/fileIDBService";
import { getSettings, setSettings, setSetting } from "../../services/settingsService";
import Header from "../Header";
import Icon from "../Icon";
import Dropdown from "../Dropdown";
import LandingPage from "../LandingPage";
import Notification from "../Notification";
import NoFilesNotice from "./NoFilesNotice";
import FileCard from "../FileCard";
import FileCardPlaceholder from "./FileCardPlaceholder";
import FileSearch from "./FileSearch";
import FilesSort from "./FilesSort";
import FilesModal from "./FilesModal";
import "./files.scss";

export default function Files() {
  const [state, setState] = useState(null);
  const [files, setFiles] = useState([]);
  const [notification, setNotification] = useState(null);
  const [categoryMenuVisible, setCategoryMenuVisibility] = useState(null);
  const [filesLoading, setFilesLoading] = useState(false);
  const [landingPageHidden, setLandingPageHidden] = useState(() => localStorage.getItem("hide-landing-page"));
  const [modal, setModal] = useState(null);
  const memoizedDropHandler = useCallback(handleDrop, [state, files]);
  const memoizedDragoverHandler = useCallback(handleDragover, [state, files]);

  useEffect(() => {
    if (landingPageHidden) {
      init();
    }
    else {
      window.title = "ModestRead";
    }
  }, [landingPageHidden]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function loadPdfFile(file) {
      const pdf = await getPdfInstance(file.blob);
      const [metadata, coverImage] = await Promise.all([pdf.getMetadata(), pageToDataURL(pdf)]);

      delete file.loading;
      delete file.blob;

      Object.assign(file, {
        ...parsePdfMetadata(metadata),
        coverImage,
        viewMode: "multi",
        pageCount: pdf.numPages
      });

      setFiles([...files]);
      saveFile(file);
    }

    async function loadEpubFile(file) {
      const { default: epubjs } = await import("epubjs");
      const book = epubjs(file.blob);

      await book.ready;

      const [metadata, cfiArray, coverImage] = await Promise.all([
        book.loaded.metadata,
        book.locations.generate(1650),
        getEpubCoverUrl(book)
      ]);

      if (metadata.title) {
        file.title = metadata.title;
      }

      if (metadata.creator) {
        file.author = metadata.creator;
      }
      file.storedPosition = JSON.stringify(cfiArray);
      file.pageCount = book.locations.length();
      file.coverImage = coverImage;
      file.viewMode = "single";

      delete file.loading;
      delete file.blob;

      setFiles([...files]);
      saveFile(file);
    }

    async function loadFile(file) {
      if (file.type === "pdf") {
        loadPdfFile(file);
      }
      else if (file.type === "epub") {
        loadEpubFile(file);
      }
    }

    async function loadFiles() {
      for (const file of files) {
        if (file.loading) {
          loadFile(file);
        }
      }
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
    const settings = getSettings();
    const files = await fetchIDBFiles(settings);

    setFiles(files);
    setState({
      visibleCategory: "all",
      categories: getCategories(files),
      sortBy: settings.sortBy,
      sortOrder: settings.sortOrder,
      type: settings.layoutType,
      showCategories: settings.showCategories
    });
    setDocumentTitle("Files");
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
        newFiles.push({
          blob: file,
          id: uuidv4(),
          createdAt: Date.now(),
          name: file.name,
          size: file.size,
          type: file.name.slice(file.name.lastIndexOf(".") + 1),
          sizeString: getFileSizeString(file.size),
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
    const newSortedFiles = sortFiles(newFiles.concat(files), { sortBy: state.sortBy, sortOrder: state.sortOrder });

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
    const index = files.findIndex(file => file.id === id);
    const file = files[index];

    if (status === file.status) {
      return;
    }

    if (status === "reset") {
      delete file.status;
    }
    else {
      file.status = status;

      if (status === "reading") {
        file.accessedAt = Date.now();
        files.splice(index, 1);
        files.unshift(file);
      }
    }
    setFiles([...files]);
    setState({
      ...state,
      categories: getCategories(files)
    });
    saveFile(file);
  }

  function resetProgress() {
    const file = files.find(file => file.id === modal.id);

    file.status = "not started";
    file.pageNumber = 1;

    if (file.type === "epub") {
      delete file.location;
    }
    delete file.accessedAt;
    delete file.scrollLeft;
    delete file.scrollTop;

    setFiles([...files]);
    setState({
      ...state,
      categories: getCategories(files)
    });
    saveFile(file);
    hideModal();
  }

  function showResetProgressModal(id) {
    setModal({
      id,
      type: "reset",
      iconId: "reset",
      title: "Reset Progress?",
      message: "Are you sure you want to reset reading progress for this file?",
      action: "Reset"
    });
  }

  function removeFile() {
    const { id } = modal;
    const index = files.findIndex(file => file.id === id);

    files.splice(index, 1);
    setFiles([...files]);
    setState({
      ...state,
      categories: getCategories(files)
    });
    deleteIDBFile(id);
    hideModal();
  }

  function showRemoveFileModal(id) {
    setModal({
      id,
      type: "remove",
      iconId: "trash",
      title: "Remove File?",
      message: "Are you sure you want to remove this file?",
      action: "Remove"
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
  }

  function sortFileCatalog(sortBy, sortOrder = 1) {
    if (sortBy === state.sortBy && sortOrder === state.sortOrder) {
      return;
    }
    const sortedFiles = sortFiles(files, { sortBy, sortOrder });

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
          <input type="file" onChange={handleFileUpload} className="sr-only" accept="application/pdf" multiple/>
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
        <Header/>
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
      <FileCard file={file} showLink={true} key={file.id}>
        <Dropdown
          toggle={{
            content: <Icon name="dots-vertical"/>,
            title: "More",
            className: "btn icon-btn"
          }}>
          <div className="files-file-card-dropdown-group">
            <div className="files-file-card-dropdown-group-title">Reading Status</div>
            {state.categories.slice(1).map((category, i) => (
              <button className={`btn icon-text-btn dropdown-btn files-file-card-dropdown-btn${file.status === category.id ? " active" : ""}`} key={i}
                onClick={() => changeReadingStatus(file.id, category.id)}>
                <Icon name={category.icon}/>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
          <div className="files-file-card-dropdown-group">
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
    const { files: originalFiles } = state.categories.find(({ id }) => id === state.visibleCategory);
    const message = state.searchCategories && originalFiles.length ?
      "Your search term doesn't match any files in this category." :
      "You have no files in this category.";

    return <p className="files-category-notice">{message}</p>;
  }

  if (!landingPageHidden) {
    return <LandingPage hide={hideLandingPage}/>;
  }
  else if (state) {
    return (
      <div className="container">
        {files.length ? (
          <>
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
          </>
        ) : <NoFilesNotice notification={notification}
          dismiss={dismissNotification}
          handleFileUpload={handleFileUpload}/>
        }
        {modal ? <FilesModal {...modal} resetProgress={resetProgress} removeFile={removeFile} hide={hideModal}/> : null}
      </div>
    );
  }
  return null;
}
