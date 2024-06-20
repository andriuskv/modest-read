import { useState, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { setDocumentTitle, pageToDataURL, getPdfInstance, parsePdfMetadata, getEpubCoverUrl, getFileSizeString, computeHash, delay } from "utils";
import { useUser } from "contexts/user-context";
import * as fileService from "services/fileService";
import { getSettings, setSettings, setSetting } from "services/settingsService";
import Header from "components/Header";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import LandingPage from "components/LandingPage";
import ErrorPage from "components/ErrorPage";
import FileCard from "components/FileCard";
import "./files.css";
import FileCardPlaceholder from "./FileCardPlaceholder";
import FileSearch from "./FileSearch";
import FilesSort from "./FilesSort";

const Notification = lazy(() => import("components/Notification"));
const ConfirmationModal = lazy(() => import("components/ConfirmationModal"));
const CategoryModal = lazy(() => import("./CategoryModal"));

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
  const [confirmationModal, setConfirmationModal] = useState(null);
  const [categoryModal, setCategoryModal] = useState(false);

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
  }, [user, landingPageHidden]);

  useEffect(() => {
    const filesToSave = [];
    let intervalId = 0;
    let loadingCount = 0;

    async function loadPdfFile(file) {
      const pdf = await getPdfInstance(file.blob);
      const [metadata, coverImage, hash] = await Promise.all([
        pdf.getMetadata(),
        pageToDataURL(pdf),
        computeHash(file.blob)
      ]);

      fileService.cacheFile(hash, file.blob);

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
      const { default: epubjs } = await import("epubjs");
      const book = epubjs(file.blob);

      await book.ready;

      const [metadata, coverImage, hash] = await Promise.all([
        book.loaded.metadata,
        getEpubCoverUrl(book),
        computeHash(file.blob),
        book.locations.generate(1650)
      ]);

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

      fileService.cacheFile(hash, file.blob);

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
  }, [filesLoading]);

  useEffect(() => {
    window.addEventListener("files", handleFileUpload);

    return () => {
      window.removeEventListener("files", handleFileUpload);
    };
  }, [state, files]);

  async function init() {
    try {
      const settings = getSettings();
      const data = await fileService.fetchFiles(settings, user);

      if (data.message) {
        setNotification({ value: data.message });
      }

      if (data.files) {
        const categories = getCategories(data.files);
        let visibleCategory = localStorage.getItem("visible-category");

        if (!categories.some(category => category.id === visibleCategory)) {
          visibleCategory = "default";
        }

        setFiles(data.files);
        setState({
          visibleCategory,
          categories,
          sortBy: settings.sortBy,
          sortOrder: settings.sortOrder,
          layoutType: settings.layoutType
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

  function handleFileUpload(event) {
    processFiles(event.detail);
  }

  function processFiles(importedFiles) {
    const supportedFiles = Array.from(importedFiles).filter(file => file.name.endsWith(".pdf") || file.name.endsWith(".epub"));

    if (importedFiles.length === 1) {
      let message = "";

      if (!supportedFiles.length) {
        message = "No supported files found.";
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
    const invalidFiles = [];
    const newFiles = [];
    const sizeLimit = 100 * 1000 * 1000;

    for (const file of supportedFiles) {
      if (file.size > sizeLimit) {
        invalidFiles.push(file.name);
        continue;
      }
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
          ...params,
          blob: file,
          id: uuidv4(),
          createdAt: Date.now(),
          name: file.name,
          size: file.size,
          type: file.name.slice(file.name.lastIndexOf(".") + 1),
          sizeString: getFileSizeString(file.size),
          pageNumber: 1,
          loading: true
        });
      }
    }

    if (duplicateFiles.length || invalidFiles.length) {
      const message = "Duplicate and files exceeding 100 MB were skipped.";

      if (duplicateFiles.length + invalidFiles.length === importedFiles.length) {
        setNotification({ value: `No file were imported. ${message}` });
        setCategoryMenuVisibility(false);
        return;
      }
      else {
        setNotification({
          value: message,
          files: duplicateFiles.concat(invalidFiles),
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
    const categories = JSON.parse(localStorage.getItem("categories")) || [{
      name: "Default",
      id: "default",
      files: []
    },
    {
      name: "Reading",
      id: "reading",
      files: []
    },
    {
      name: "Plan To Read",
      id: "plan-to-read",
      files: []
    },
    {
      name: "Completed",
      id: "completed",
      files: []
    },
    {
      name: "Dropped",
      id: "dropped",
      files: []
    }];

    let defaultCategory = categories.find(category => category.id === "default");

    if (!defaultCategory) {
      categories.unshift({
        name: "Default",
        id: "default",
        files: []
      });
      [defaultCategory] = categories;
    }

    for (const file of files) {
      let found = false;

      for (const category of categories) {
        for (const [index, fileId] of Object.entries(category.files)) {
          if (file.id === fileId) {
            found = true;
            category.files[index] = file;
            break;
          }
        }

        if (found) {
          break;
        }
      }

      if (!found) {
        defaultCategory.files.push(file);
      }
    }

    // Remove missing category items
    for (const category of categories) {
      category.files = category.files.filter(file => typeof file !== "string");
    }
    return categories;
  }

  function handleFileInputChange(event) {
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
      localStorage.setItem("visible-category", category);

      if (categoryMenuVisible) {
        setCategoryMenuVisibility(false);
      }
    }
  }

  function getFileCategoryId(fileId) {
    for (const category of state.categories) {
      for (const file of category.files) {
        if (file.id === fileId) {
          return category.id;
        }
      }
    }
    return "default";
  }

  function enableFileCategoryUpdate(file) {
    setCategoryModal({
      action: "set",
      fileId: file.id,
      categoryId: getFileCategoryId(file.id)
    });
  }

  function resetProgress(id) {
    const file = files.find(file => file.id === id);
    const params = {
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
    hideConfirmationModal();
  }

  async function updateFile(file, params) {
    try {
      const success = await fileService.updateFile(params, {
        id: file.id,
        isLocal: file.local,
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
    setConfirmationModal({
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
      const success = await fileService.deleteFile(id, {
        isLocal: file.local,
        hash: file.hash,
        userId: user.id
      });

      if (success) {
        files.splice(index, 1);
        removeCategoryItem(file.id);
        saveCategories(state.categories);
        setFiles([...files]);
        setState({
          ...state,
          categories: getCategories(files)
        });
      }
      else {
        setNotification({ value: "Could not remove file. Try again later." });
      }
      hideConfirmationModal();
    } catch (e) {
      console.log(e);
      setNotification({ value: "Could not remove file. Try again later." });
    }
  }

  function removeCategoryItem(fileId) {
    for (const category of state.categories) {
      const fileIndex = category.files.findIndex(item => item.id === fileId);

      if (fileIndex >= 0) {
        category.files.splice(fileIndex, 1);
        break;
      }
    }
  }

  function showRemoveFileModal(id) {
    setConfirmationModal({
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
        const deleted = await fileService.deleteFile(file.id, {
          deleteFromCache: false,
          isLocal: !file.local,
          hash: file.hash,
          userId: user.id
        });

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
      hideConfirmationModal();
    }
  }

  function showFileTransferModal(file) {
    let action = null;

    if (file.local) {
      action = {
        iconId: "cloud",
        name: "Upload",
        message: "Are you sure you want to upload metadata of this file? It will become inaccessible without internet connection."
      };
    }
    else {
      action = {
        iconId: "download",
        name: "Download",
        message: "Are you sure you want to download metadata of this file? It will no longer be available to other devices."
      };
    }
    setConfirmationModal({
      iconId: action.iconId,
      title: `${action.name} metadata?`,
      message: action.message,
      actionName: action.name,
      action: () => transferFile(file)
    });
  }

  function hideConfirmationModal() {
    setConfirmationModal(null);
  }

  function dismissNotification() {
    setNotification(null);
  }

  function changeLayout(type) {
    if (type !== state.layoutType) {
      setState({ ...state, layoutType: type });
      setSetting("layoutType", type);
    }
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

    for (const category of state.categories) {
      category.files = fileService.sortFiles(category.files, { sortBy, sortOrder });
    }

    setFiles(sortedFiles);
    setState({
      ...state,
      sortBy,
      sortOrder,
      categories: state.categories
    });
    saveCategories(state.categories);
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

  function showCategoryModal() {
    setCategoryModal({});
  }

  function hideCategoryModal() {
    setCategoryModal(null);
  }

  function assignCategory(id) {
    if (id !== categoryModal.categoryId) {
      let fileIndex = -1;
      let file = null;

      for (const category of state.categories) {
        fileIndex = category.files.findIndex(item => item.id === categoryModal.fileId);

        if (fileIndex >= 0) {
          file = category.files[fileIndex];
          category.files.splice(fileIndex, 1);
          break;
        }
      }
      const category = state.categories.find(category => category.id === id);

      category.files.push(file);
      setState({ ...state });
      saveCategories(state.categories);
    }
    hideCategoryModal();
  }

  function changeCategoryOrder(order, id) {
    const index = state.categories.findIndex(category => category.id === id);

    if (order === -1 && index <= 0 || order === 1 && index >= state.categories.length - 1) {
      return;
    }
    ([state.categories[index], state.categories[index + order]] = [state.categories[index + order], state.categories[index]]);
    setState({ ...state });
    saveCategories(state.categories);
  }

  function removeCategory(id) {
    const index = state.categories.findIndex(category => category.id === id);
    const category = state.categories[index];

    if (category.files.length) {
      const defaultCategory = state.categories.find(category => category.id === "default");
      defaultCategory.files.push(...category.files);
    }

    if (state.visibleCategory === id) {
      state.visibleCategory = "default";
    }
    state.categories.splice(index, 1);
    setState({ ...state });
    saveCategories(state.categories);
  }

  function createCategory(name) {
    state.categories.push({
      name,
      id: crypto.randomUUID(),
      files: []
    });
    setState({ ...state });
    saveCategories(state.categories);
  }

  function updateCategoryName(name, id) {
    const index = state.categories.findIndex(category => category.id === id);

    state.categories[index].name = name;
    setState({ ...state });
    saveCategories(state.categories);
  }

  function saveCategories(categories) {
    localStorage.setItem("categories", JSON.stringify(categories.map(category => ({
      id: category.id,
      name: category.name,
      files: category.files.map(item => item.id)
    }))));
  }

  function renderMoreBtns() {
    return (
      <>
        <Link to="/statistics" className="btn icon-text-btn files-more-dropdown-btn files-sidebar-stats-btn">
          <Icon id="stats" size="24px"/>
          <span>Statistics</span>
        </Link>
        <label className="btn icon-text-btn dropdown-btn files-more-dropdown-btn files-import-btn">
          <Icon id="upload" size="24px"/>
          <span>Import Files</span>
          <input type="file" onChange={handleFileInputChange} className="sr-only" accept="application/pdf, application/epub+zip" multiple/>
        </label>
      </>
    );
  }

  function renderCategoryMenu() {
    return (
      <div className="files-header">
        <button className="btn icon-btn files-sidebar-toggle-btn" onClick={toggleMenu} title="Toggle sidebar">
          <Icon id="menu" size="24px"/>
        </button>
        <Header shouldRenderUser={true}/>
        <div className={`files-sidebar-container${categoryMenuVisible ? " visible" : ""}`} onClick={hideMenu}>
          <div className="files-sidebar">
            <div className="files-sidebar-title-container">
              <span className="files-sidebar-title">ModestRead</span>
            </div>
            <ul className="files-categories">
              {state.categories.map((category, i) => (
                <li key={i}>
                  <button className={`btn icon-text-btn files-category-btn${state.visibleCategory === category.id ? " active" : ""}`}
                    onClick={() => selectCategory(category.id)}>
                    <span>{category.name}</span>
                    <span>{category.files.length}</span>
                  </button>
                </li>
              ))}
            </ul>
            {renderMoreBtns()}
            <Dropdown
              toggle={{
                content: <Icon id="dots-vertical" size="24px"/>,
                title: "More",
                className: "btn icon-btn icon-btn-alt files-more-dropdown-toggle-btn"
              }}
              body={{ className: "files-more-dropdown" }}>
              {renderMoreBtns()}
              <div className="files-layout-setting">
                <button className={`btn icon-text-btn files-layout-setting-item${state.layoutType === "grid" ? " active" : ""}`}
                  onClick={() => changeLayout("grid")}>
                  <Icon id="grid" size="24px"/>
                  <span>Grid</span>
                </button>
                <button className={`btn icon-text-btn files-layout-setting-item${state.layoutType === "list" ? " active" : ""}`}
                  onClick={() => changeLayout("list")}>
                  <Icon id="list" size="24px"/>
                  <span>List</span>
                </button>
              </div>
              <button className="btn text-btn text-btn-alt dropdown-btn files-more-dropdown-categories-btn"
                onClick={showCategoryModal}>Categories</button>
            </Dropdown>
          </div>
        </div>
      </div>
    );
  }

  function renderFile(file) {
    return (
      <FileCard file={file} showLink={true} user={user} key={file.id}>
        <button className="btn icon-btn" onClick={() => enableFileCategoryUpdate(file)}>
          <Icon id="bookshelf"/>
        </button>
        <Dropdown
          toggle={{
            content: <Icon id="dots-vertical"/>,
            title: "More",
            className: "btn icon-btn"
          }}>
          <div className="files-file-card-dropdown-group">
            {user.email ? file.local ? (
              <button className="btn icon-text-btn dropdown-btn files-file-card-dropdown-btn"
                onClick={() => showFileTransferModal(file)}>
                <Icon id="cloud"/>
                <span>Upload</span>
              </button>
            ) : (
              <button className="btn icon-text-btn dropdown-btn files-file-card-dropdown-btn"
                onClick={() => showFileTransferModal(file)}>
                <Icon id="download"/>
                <span>Download</span>
              </button>
            ) : null}
            <button className="btn icon-text-btn dropdown-btn files-file-card-dropdown-btn"
              onClick={() => showResetProgressModal(file.id)}>
              <Icon id="reset"/>
              <span>Reset Progress</span>
            </button>
            <button className="btn icon-text-btn dropdown-btn files-file-card-dropdown-btn"
              onClick={() => showRemoveFileModal(file.id)}>
              <Icon id="trash"/>
              <span>Remove File</span>
            </button>
          </div>
        </Dropdown>
      </FileCard>
    );
  }

  function renderFiles(files) {
    return (
      <ul className={`files-cards ${state.layoutType}`}>
        {files.map(file => file.loading ? <FileCardPlaceholder key={file.id}/> : renderFile(file))}
      </ul>
    );
  }

  function renderFileCategory() {
    const categories = state.searchCategories || state.categories;
    const category = categories.find(({ id }) => id === state.visibleCategory);

    if (category?.files.length) {
      return renderFiles(category.files);
    }
    const { files: originalFiles } = state.categories.find(({ id }) => id === state.visibleCategory);

    if (state.searchCategories && originalFiles.length) {
      return <p className="files-category-notice">Your search term doesn't match any files in this category.</p>;
    }
    return (
      <div className="files-category-notice">
        <p className="files-category-notice-message">You have no files in this category.</p>
        <label className="btn icon-text-btn primary-btn no-files-notice-btn">
          <Icon id="upload" size="24px"/>
          <span>Import Files</span>
          <input type="file" onChange={handleFileInputChange} className="sr-only" accept="application/pdf, application/epub+zip" multiple/>
        </label>
      </div>
    );
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
          <Suspense fallback={null}>
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
          </Suspense>
        )}
        {renderFileCategory()}
        {confirmationModal ? (
          <Suspense fallback={null}>
            <ConfirmationModal {...confirmationModal} hide={hideConfirmationModal}/>
          </Suspense>
        ) : null}
        {importMessage ? <div className="files-import-message">{importMessage}</div> : null}
        {categoryModal ? (
          <Suspense fallback={null}>
            <CategoryModal modal={categoryModal} categories={state.categories}
              assignCategory={assignCategory} changeCategoryOrder={changeCategoryOrder}
              removeCategory={removeCategory} createCategory={createCategory} updateCategoryName={updateCategoryName} hide={hideCategoryModal}/>
          </Suspense>
        ) : null}
      </div>
    );
  }
  return <LandingPage hide={hideLandingPage}/>;
}
