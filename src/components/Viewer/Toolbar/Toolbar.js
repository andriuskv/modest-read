import { useLayoutEffect, useRef } from "react";
import { dispatchCustomEvent } from "utils";
import { setSetting } from "services/settingsService";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import FileInfo from "../FileInfo";
import "./toolbar.css";

export default function Toolbar({ file, shouldBeHidden, settings, setViewerSettings, updateTitleBarColor, exitViewer, showMarginModal }) {
  const toolbarRef = useRef(null);
  const toolbarToggleBtnRef = useRef(null);
  const timeoutId = useRef(0);

  useLayoutEffect(() => {
    toolbarRef.current.classList.toggle("revealed", settings.toolbarVisible);
    toolbarRef.current.classList.toggle("hiding", !settings.toolbarVisible);
    toolbarToggleBtnRef.current.style.transform = `rotate(${settings.toolbarVisible ? 180 : 0}deg)`;

    window.addEventListener("toolbar-toggle", toggleToolbar);

    return () => {
      window.removeEventListener("toolbar-toggle", toggleToolbar);
    };
  }, [shouldBeHidden]);

  function toggleToolbar() {
    const visible = !settings.toolbarVisible;

    clearTimeout(timeoutId.current);

    toolbarToggleBtnRef.current.style.transform = `rotate(${visible ? 180 : 0}deg)`;

    if (visible) {
      updateTitleBarColor(visible);
      toolbarRef.current.classList.add("revealed");

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
        toolbarRef.current.classList.remove("revealed");
        setSettings("toolbarVisible", visible);
        updateTitleBarColor(visible);
      }, 200);
    }
  }

  function setSettings(name, value) {
    setViewerSettings(name, value);
    setSetting(name, value);
  }

  function handleCheckboxChange(event) {
    setViewerSettings("navigationAreasDisabled", event.target.checked);
    setSetting("navigationAreasDisabled", event.target.checked);
  }

  function handleFileInputChange(event) {
    dispatchCustomEvent("files", event.target.files);
    event.target.value = "";
  }

  return (
    <>
      <div className={`viewer-toolbar${shouldBeHidden ? " hidden" : ""}`} ref={toolbarRef}>
        <div className="view-toolbar-side">
          <FileInfo file={file}/>
          <button id="js-viewer-outline-toggle-btn" className="btn icon-btn icon-btn-alt viewer-outline-toggle-btn" title="Toggle outline">
            <Icon id="outline"/>
          </button>
          <div className="viewer-toolbar-zoom">
            <button className="btn icon-btn viewer-toolbar-tool-btn" title="Zoom out" data-type="out">
              <Icon id="minus"/>
            </button>
            <Dropdown
              toggle={{
                content: (
                  <>
                    <Icon id="zoom" className="viewer-zoom-dropdown-icon"/>
                    <span className="viewer-zoom-value"></span>
                  </>
                ),
                title: "Zoom options",
                className: "btn text-btn viewer-zoom-dropdown-toggle-btn"
              }}
              body={{ className: "viewer-toolbar-zoom-dropdown" }}
              container={{ className: "viewer-toolbar-zoom-dropdown-container" }}>
              <div className="viewer-toolbar-zoom-dropdown-top">
                <button className="btn icon-btn viewer-toolbar-tool-btn" title="Zoom out" data-type="out">
                  <Icon id="minus"/>
                </button>
                <span className="viewer-zoom-value"></span>
                <button className="btn icon-btn viewer-toolbar-tool-btn" title="Zoom in" data-type="in">
                  <Icon id="plus"/>
                </button>
              </div>
              <div id="js-viewer-toolbar-zoom-dropdown-options" className="viewer-toolbar-zoom-dropdown-options">
                {file.type === "pdf" && <button className="btn text-btn dropdown-btn viewer-toolbar-dropdown-btn" data-value="fit-width">Fit width</button>}
                {file.type === "pdf" && <button className="btn text-btn dropdown-btn viewer-toolbar-dropdown-btn" data-value="fit-page">Fit page</button>}
                <button className="btn text-btn dropdown-btn viewer-toolbar-dropdown-btn" data-value="0.5">50%</button>
                <button className="btn text-btn dropdown-btn viewer-toolbar-dropdown-btn" data-value="0.75">75%</button>
                <button className="btn text-btn dropdown-btn viewer-toolbar-dropdown-btn" data-value="1">100%</button>
                <button className="btn text-btn dropdown-btn viewer-toolbar-dropdown-btn" data-value="1.5">150%</button>
                <button className="btn text-btn dropdown-btn viewer-toolbar-dropdown-btn" data-value="2">200%</button>
                <button className="btn text-btn dropdown-btn viewer-toolbar-dropdown-btn" data-value="3">300%</button>
                <button className="btn text-btn dropdown-btn viewer-toolbar-dropdown-btn" data-value="4">400%</button>
              </div>
            </Dropdown>
            <button className="btn icon-btn viewer-toolbar-tool-btn" title="Zoom in" data-type="in">
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
              <button className="btn icon-text-btn dropdown-btn viewer-toolbar-dropdown-btn" data-mode="single">
                <Icon id="page"/>
                <span>Single page</span>
              </button>
              <button className="btn icon-text-btn dropdown-btn viewer-toolbar-dropdown-btn" data-mode="multi">
                <Icon id="pages"/>
                <span>Multi page</span>
              </button>
            </div>
            <div className="viewer-toolbar-dropdown-group viewer-toolbar-dropdown-group-alt">
              <label className="viewer-toolbar-settings-item">
                <input type="checkbox" className="sr-only checkbox-input"
                  checked={settings.navigationAreasDisabled}
                  onChange={handleCheckboxChange}/>
                <div className="checkbox">
                  <div className="checkbox-tick"></div>
                </div>
                <span className="checkbox-label">Disable navigation areas</span>
              </label>
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
              <div className="viewer-toolbar-dropdown-group viewer-toolbar-dropdown-group-alt">
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
                <input type="file" onChange={handleFileInputChange} className="sr-only" accept="application/pdf, application/epub+zip"/>
              </label>
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
