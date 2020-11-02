import React, { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { setDocumentTitle, pageToDataURL, getPdfInstance, parseMetadata, getFileSizeString } from "../../utils";
import { fetchIDBFiles, saveFile, deleteIDBFile, sortFiles } from "../../services/fileIDBService";
import { getSettings, setSettings, setSetting } from "../../services/settingsService";
import Icon from "../Icon";
import Dropdown from "../Dropdown";
import LandingPage from "../LandingPage";
import Notification from "../Notification";
import NoFilesNotice from "./NoFilesNotice";
import FilesSort from "./FilesSort";
import FileCardPlaceholder from "./FileCardPlaceholder";
import FileCard from "../FileCard";
import "./files.scss";

export default function Files() {
  const [state, setState] = useState(null);
  const [files, setFiles] = useState([]);
  const [notification, setNotification] = useState(null);
  const [categoryMenuVisible, setCategoryMenuVisibility] = useState(null);
  const [filesLoading, setFilesLoading] = useState(false);
  const [landingPageHidden, setLandingPageHidden] = useState(localStorage.getItem("hide-landing-page"));
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
    async function loadFile(file, pdfjs) {
      const pdf = await getPdfInstance(file.file, pdfjs);
      const [metadata, coverImage] = await Promise.all([pdf.getMetadata(), pageToDataURL(pdf)]);

      delete file.loading;
      delete file.file;

      Object.assign(file, {
        ...parseMetadata(metadata),
        coverImage,
        pageCount: pdf.numPages
      });

      setFiles([...files]);
      saveFile(file);
    }

    async function loadFiles() {
      const pdfjs = await import("pdfjs-dist/webpack");

      for (const file of files) {
        if (file.loading) {
          loadFile(file, pdfjs);
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
    const supportedFiles = Array.from(importedFiles).filter(file => file.name.endsWith(".pdf"));

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
          file,
          id: uuidv4(),
          createdAt: Date.now(),
          name: file.name,
          size: file.size,
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
    const newSortedFiles = sortFiles(newFiles.concat(files));

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
      name: "Have Read",
      id: "have read",
      icon: "book-check-mark",
      files: []
    },
    {
      name: "Not Started",
      id: "not started",
      icon: "book",
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

  function resetProgress(id) {
    const file = files.find(file => file.id === id);
    file.status = "not started";
    file.pageNumber = 1;

    delete file.accessedAt;
    delete file.scale;
    delete file.scrollLeft;
    delete file.scrollTop;

    setFiles([...files]);
    setState({
      ...state,
      categories: getCategories(files)
    });
    saveFile(file);
  }

  function removeFile(id) {
    const index = files.findIndex(file => file.id === id);

    files.splice(index, 1);
    setFiles([...files]);
    setState({
      ...state,
      categories: getCategories(files)
    });
    deleteIDBFile(id);
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

  function renderCategoryMenu() {
    return (
      <div className="files-header">
        <div className="files-sidebar-toggle-btn-container">
          <button className="btn icon-btn" onClick={toggleMenu}>
            <Icon name="menu" size="24px"/>
          </button>
        </div>
        <div className="files-header-title-container">
          <h1 className="files-header-title">ModestRead</h1>
        </div>
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
            <label className="btn icon-text-btn dropdown-btn files-import-btn">
              <Icon name="upload" size="24px"/>
              <span>Import Files</span>
              <input type="file" onChange={handleFileUpload} className="sr-only" accept="application/pdf" multiple/>
            </label>
            <Dropdown
              toggle={{
                content: <Icon name="settings" size="24px"/>,
                title: "Settings",
                className: "btn icon-btn icon-btn-alt files-settings-toggle-btn"
              }}
              body={{ className: "files-settings" }}>
              <div className="files-settings-layout">
                <button className={`btn icon-text-btn files-settings-layout-item${state.type === "grid" ? " active" : ""}`}
                  onClick={() => changeLayout("grid")}>
                  <Icon name="grid" size="24px"/>
                  <span>Grid</span>
                </button>
                <button className={`btn icon-text-btn files-settings-layout-item${state.type === "list" ? " active" : ""}`}
                  onClick={() => changeLayout("list")}>
                  <Icon name="list" size="24px"/>
                  <span>List</span>
                </button>
              </div>
              <label className="checkbox-container files-settings-show-categories-setting">
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
              onClick={() => resetProgress(file.id)}>
              <Icon name="reset"/>
              <span>Reset Progress</span>
            </button>
            <button className="btn icon-text-btn dropdown-btn files-file-card-dropdown-btn"
              onClick={() => removeFile(file.id)}>
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
    if (state.visibleCategory === "all" && state.showCategories) {
      return (
        <div>
          {state.categories.slice(1).map((category, i) => (
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
    const { files } = state.categories.find(({ id }) => id === state.visibleCategory);

    if (files.length) {
      return renderFiles(files);
    }
    return <p className="files-empty-category-notice">You have no files in this category.</p>;
  }

  if (!landingPageHidden) {
    return <LandingPage hide={hideLandingPage}/>;
  }
  else if (state) {
    return (
      <div className="files">
        {files.length ? (
          <>
            {renderCategoryMenu()}
            <FilesSort sortBy={state.sortBy} sortOrder={state.sortOrder} sortFileCatalog={sortFileCatalog}/>
            {notification && (
              <Notification notification={notification} expandable={notification.expandable}
                dismiss={dismissNotification}>
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
      </div>
    );
  }
  return null;
}
