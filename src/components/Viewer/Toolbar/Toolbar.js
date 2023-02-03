import { useLayoutEffect, useRef } from "react";
import { setSetting } from "services/settingsService";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import FileInfo from "../FileInfo";
import "./toolbar.css";

export default function Toolbar({ file, settings, fileWarning, setViewerSettings, updateFileSaveSetting, handleFileUpload, exitViewer, showMarginModal }) {
  const toolbarRef = useRef(null);
  const toolbarToggleBtnRef = useRef(null);
  const timeoutId = useRef(0);

  useLayoutEffect(() => {
    toolbarRef.current.classList.toggle("visible", settings.toolbarVisible);
    toolbarRef.current.classList.toggle("hiding", !settings.toolbarVisible);
    toolbarToggleBtnRef.current.style.transform = `rotate(${settings.toolbarVisible ? 180 : 0}deg)`;

    window.addEventListener("toolbar-toggle", toggleToolbar);

    return () => {
      window.removeEventListener("toolbar-toggle", toggleToolbar);
    };
  }, []);

  function toggleToolbar() {
    const visible = !settings.toolbarVisible;

    clearTimeout(timeoutId.current);

    toolbarToggleBtnRef.current.style.transform = `rotate(${visible ? 180 : 0}deg)`;

    if (visible) {
      toolbarRef.current.classList.add("visible");

      requestAnimationFrame(() => {
        toolbarRef.current.classList.remove("hiding");
      });

      timeoutId.current = setTimeout(() => {
        setSettings("toolbarVisible", visible);
      }, 200);
    }
    else {
      toolbarRef.current.classList.add("hiding");

      timeoutId.current = setTimeout(() => {
        toolbarRef.current.classList.remove("visible");
        setSettings("toolbarVisible", visible);
      }, 200);
    }
  }

  function setSettings(name, value) {
    setViewerSettings(name, value);
    setSetting(name, value);
  }

  return (
    <>
      <div className="viewer-toolbar" ref={toolbarRef}>
        <div className="view-toolbar-side">
          <FileInfo file={file}/>
          <button id="js-viewer-outline-toggle-btn" className="btn icon-btn icon-btn-alt viewer-outline-toggle-btn" title="Toggle outline">
            <Icon id="outline"/>
          </button>
          <div className="viewer-toolbar-zoom">
            <button id="js-viewer-zoom-out" className="btn icon-btn viewer-toolbar-tool-btn" title="Zoom out">
              <Icon id="minus"/>
            </button>
            <select id="js-viewer-scale-select" className="input viewer-toolbar-zoom-select">
              <option value="custom" style={{ display: "none" }}></option>
              {file.type === "pdf" && <option value="fit-width">Fit Width</option>}
              {file.type === "pdf" && <option value="fit-page">Fit Page</option>}
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1">100%</option>
              <option value="1.5">150%</option>
              <option value="2">200%</option>
              <option value="3">300%</option>
              <option value="4">400%</option>
            </select>
            <button id="js-viewer-zoom-in" className="btn icon-btn viewer-toolbar-tool-btn" title="Zoom in">
              <Icon id="plus"/>
            </button>
          </div>
        </div>
        <div className="view-toolbar-side">
          <div className="viewer-toolbar-page">
            <button id="js-viewer-previous-page" className="btn icon-btn viewer-toolbar-tool-btn">
              <Icon id="arrow-up"/>
            </button>
            <div id="js-viewer-page-input-container" className="viewer-toolbar-page-input-container">
              <input id="js-viewer-page-input" type="text" inputMode="numeric" className="input viewer-toolbar-page-input"/>
              <span></span>
            </div>
            <button id="js-viewer-next-page" className="btn icon-btn viewer-toolbar-tool-btn">
              <Icon id="arrow-down"/>
            </button>
          </div>
          <Dropdown
            toggle={{
              content: <Icon id="settings"/>,
              title: "Settings",
              className: "btn icon-btn icon-btn-alt"
            }}
            body={{ className: "viewer-toolbar-dropdown" }}
            container={{ className: "viewer-toolbar-dropdown-container"}}>
            {file.type === "pdf" && (
              <div className="viewer-toolbar-dropdown-group">
                <button id="js-viewer-rotate-btn" className="btn icon-text-btn dropdown-btn viewer-toolbar-dropdown-btn">
                  <Icon id="rotate"/>
                  <span>Rotate pages</span>
                </button>
              </div>
            )}
            <div id="js-viewer-view-modes" className="viewer-toolbar-dropdown-group">
              <button className="btn icon-text-btn dropdown-btn viewer-toolbar-dropdown-btn viewer-view-mode-btn" data-mode="single">
                <Icon id="page"/>
                <span>Single page</span>
              </button>
              <button className="btn icon-text-btn dropdown-btn viewer-toolbar-dropdown-btn viewer-view-mode-btn" data-mode="multi">
                <Icon id="pages"/>
                <span>Multi page</span>
              </button>
            </div>
            {file.type === "epub" && (
              <>
                <div id="js-viewer-spread-pages-setting"
                  className={`viewer-toolbar-dropdown-group viewer-toolbar-dropdown-group-alt${settings.epub.viewMode === "multi" ? " hidden" : ""}`}>
                  <label className="viewer-toolbar-settings-item">
                    <input type="checkbox" id="js-viewer-spread-pages" className="sr-only checkbox-input"/>
                    <div className="checkbox">
                      <div className="checkbox-tick"></div>
                    </div>
                    <span className="checkbox-label">Spread pages</span>
                  </label>
                </div>
                <div className="viewer-toolbar-dropdown-group">
                  <button className="btn icon-text-btn dropdown-btn viewer-toolbar-dropdown-btn" onClick={showMarginModal}>
                    <Icon id="margin"/>
                    <span>Set margin</span>
                  </button>
                </div>
                <div className="viewer-toolbar-dropdown-group viewer-toolbar-dropdown-group-alt">
                  <div className="viewer-toolbar-dropdown-group-title">Themes</div>
                  <div id="js-viewer-themes" className="viewer-themes">
                    <button className="btn viewer-theme-btn black" data-theme="black">A</button>
                    <button className="btn viewer-theme-btn white" data-theme="white">A</button>
                    <button className="btn viewer-theme-btn grey" data-theme="grey">A</button>
                    <button className="btn viewer-theme-btn orange" data-theme="orange">A</button>
                  </div>
                  <label>
                    <div className="viewer-toolbar-dropdown-group-title">Text opacity</div>
                    <input type="range" id="js-viewer-text-opacity"
                      className="range-input viewer-toolbar-dropdown-range-input" min="0.1" max="1" step="0.1"/>
                  </label>
                </div>
              </>
            )}
            {file.type === "pdf" && (
              <div className={`viewer-toolbar-dropdown-group viewer-toolbar-dropdown-group-alt${file.type === "epub" && fileWarning.hide ? " hidden" : ""}`}>
                <label className="viewer-toolbar-settings-item">
                  <input type="checkbox" id="js-viewer-invert-colors" className="sr-only checkbox-input"/>
                  <div className="checkbox">
                    <div className="checkbox-tick"></div>
                  </div>
                  <span className="checkbox-label">Invert page colors</span>
                </label>
              </div>
            )}
          </Dropdown>
          <Dropdown
            toggle={{
              content: <Icon id="dots-vertical"/>,
              title: "More",
              className: "btn icon-btn icon-btn-alt"
            }}
            body={{ className: "viewer-toolbar-dropdown" }}>
            <div className="viewer-toolbar-dropdown-group">
              <label className="btn icon-text-btn dropdown-btn viewer-toolbar-dropdown-btn">
                <Icon id="upload"/>
                <span>Load File</span>
                <input type="file" onChange={handleFileUpload} className="sr-only" accept="application/pdf, application/epub+zip"/>
              </label>
            </div>
            <div className={`viewer-toolbar-dropdown-group viewer-toolbar-dropdown-group-alt${file.type === "epub" && fileWarning.hide ? " hidden" : ""}`}>
              {!fileWarning.hide && (
                <label className="viewer-toolbar-settings-item">
                  <input type="checkbox" className="sr-only checkbox-input"
                    onChange={updateFileSaveSetting}
                    checked={fileWarning.saveFile}/>
                  <div className="checkbox">
                    <div className="checkbox-tick"></div>
                  </div>
                  <span className="checkbox-label">Save loaded file</span>
                </label>
              )}
            </div>
            <div className="viewer-toolbar-dropdown-group">
              <button className="btn icon-text-btn viewer-toolbar-dropdown-btn" onClick={exitViewer} title="Exit">
                <Icon id="exit"/>
                <span>Exit</span>
              </button>
            </div>
          </Dropdown>
        </div>
      </div>
      <button className="btn icon-btn viewer-toolbar-toggle-btn" title="Toggle toolbar"
        ref={toolbarToggleBtnRef} onClick={toggleToolbar}>
        <Icon id="chevron-down"/>
      </button>
    </>
  );
}
