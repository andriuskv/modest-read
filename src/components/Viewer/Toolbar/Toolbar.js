import { useEffect, useRef, useCallback } from "react";
import { setSetting } from "../../../services/settingsService";
import "./toolbar.scss";
import Icon from "../../Icon";
import Dropdown from "../../Dropdown";
import FileInfo from "../FileInfo";

export default function Toolbar({ file, settings, fileWarning, setViewerSettings, updateFileSaveSetting, handleFileUpload, exitViewer, showMarginModal }) {
  const keepVisible = useRef(false);
  const previousScrollTop = useRef(file.scrollTop);
  const hideAfterScroll = useRef(file.scrollTop > 0);
  const toolbarRef = useRef(null);
  const toolbarScrollOffset = useRef(0);
  const scrolling = useRef(false);
  const movingMouse = useRef(false);
  const pointerOverToolbar = useRef(false);
  const memoizedScrollHandler = useCallback(handleScroll, [settings.pdf.viewMode]);
  const memoizedMediaScrollHandler = useCallback(handleMatchedMediaScroll, [settings.pdf.viewMode]);

  useEffect(() => {
    if (file.type === "epub") {
      return;
    }
    const media = matchMedia("only screen and (hover: none) and (pointer: coarse)");

    if (media.matches) {
      toolbarRef.current.classList.toggle("hiding", file.scrollTop > 0);
      toolbarRef.current.classList.toggle("hidden", file.scrollTop > 0);

      window.addEventListener("pointerup", handleClick);
      window.addEventListener("scroll", memoizedMediaScrollHandler);

      return () => {
        window.removeEventListener("pointerup", handleClick);
        window.removeEventListener("scroll", memoizedMediaScrollHandler);
      };
    }
    else {
      window.addEventListener("scroll", memoizedScrollHandler);
      window.addEventListener("mousemove", handeMouseMove);

      return () => {
        window.removeEventListener("scroll", memoizedScrollHandler);
        window.removeEventListener("mousemove", handeMouseMove);
      };
    }
  }, [memoizedScrollHandler, memoizedMediaScrollHandler]);

  function revealToolbar() {
    if (toolbarRef.current?.classList.contains("hidden")) {
      toolbarScrollOffset.current = 0;
      toolbarRef.current.classList.remove("hidden");

      setTimeout(() => {
        toolbarRef.current.classList.remove("hiding");
      }, 200);
    }
  }

  function hideToolbar() {
    if (!toolbarRef.current?.classList.contains("hidden")) {
      toolbarScrollOffset.current = 0;
      toolbarRef.current.classList.add("hiding");

      setTimeout(() => {
        toolbarRef.current.classList.add("hidden");
      }, 200);
    }
  }

  function handleScroll() {
    if (scrolling.current) {
      return;
    }
    scrolling.current = true;

    requestAnimationFrame(() => {
      const { scrollTop } = document.documentElement;

      if (scrollTop > previousScrollTop.current) {
        if (keepVisible.current) {
          keepVisible.current = false;
        }
        else if (!pointerOverToolbar.current) {
          hideToolbar();
        }
      }
      else if (!scrollTop || toolbarScrollOffset.current > 100) {
        revealToolbar();
      }
      else {
        const scrollDiff = previousScrollTop.current - scrollTop;
        toolbarScrollOffset.current += scrollDiff;
      }
      previousScrollTop.current = scrollTop;
      scrolling.current = false;
    });
  }

  function handleMatchedMediaScroll() {
    if (scrolling.current) {
      return;
    }
    scrolling.current = true;

    requestAnimationFrame(() => {
      const { scrollTop } = document.documentElement;

      if (scrollTop < 80) {
        if (settings.pdf.viewMode === "multi") {
          revealToolbar();
        }
      }
      else if (hideAfterScroll.current) {
        hideToolbar();
      }
      else if (settings.pdf.viewMode === "multi") {
        revealToolbar();
      }
      scrolling.current = false;
    });
  }

  function handeMouseMove(event) {
    if (movingMouse.current) {
      return;
    }
    movingMouse.current = true;

    requestAnimationFrame(() => {
      if (event.clientY < 80 && event.clientX < document.documentElement.clientWidth) {
        pointerOverToolbar.current = true;

        if (toolbarRef.current.classList.contains("hidden")) {
          toolbarRef.current.classList.remove("hidden");

          setTimeout(() => {
            toolbarRef.current.classList.remove("hiding");
          }, 200);
        }
      }
      else {
        pointerOverToolbar.current = false;
      }
      movingMouse.current = false;
    });
  }

  function handleClick({ target }) {
    if (target.closest(".viewer-toolbar") || target.closest(".btn") || target.closest("#js-viewer-outline")) {
      return;
    }
    keepVisible.current = false;

    if (settings.pdf.viewMode === "multi" && document.documentElement.scrollTop < 40) {
      hideAfterScroll.current = !hideAfterScroll.current;
      return;
    }

    if (toolbarRef.current.classList.contains("hidden")) {
      hideAfterScroll.current = false;
      revealToolbar();
    }
    else {
      hideAfterScroll.current = true;
      hideToolbar();
    }
  }

  function setSettings(name, value) {
    setViewerSettings(name, value);
    setSetting(name, value);
  }

  function handleSettingChange({ target }) {
    setSettings(target.name, target.checked);
  }

  function localExitViewer() {
    window.removeEventListener("scroll", memoizedScrollHandler);
    window.removeEventListener("mousemove", handeMouseMove);
    exitViewer();
  }

  return (
    <div className={`viewer-toolbar${settings.keepToolbarVisible ? " keep-visible" : ""}`} ref={toolbarRef}>
      <div className="view-toolbar-side">
        <FileInfo file={file}/>
        <button id="js-viewer-outline-toggle-btn" className="btn icon-btn viewer-outline-toggle-btn" title="Toggle outline">
          <Icon name="outline"/>
        </button>
        <div className="viewer-toolbar-zoom">
          <button id="js-viewer-zoom-out" className="btn icon-btn viewer-toolbar-tool-btn" title="Zoom out">
            <Icon name="minus"/>
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
            <Icon name="plus"/>
          </button>
        </div>
      </div>
      <div className="view-toolbar-side">
        <div className="viewer-toolbar-page">
          <button id="js-viewer-previous-page" className="btn icon-btn viewer-toolbar-tool-btn">
            <Icon name="arrow-up"/>
          </button>
          <div id="js-viewer-page-input-container" className="viewer-toolbar-page-input-container">
            <input id="js-viewer-page-input" type="text" inputMode="numeric" className="input viewer-toolbar-page-input"/>
            <span></span>
          </div>
          <button id="js-viewer-next-page" className="btn icon-btn viewer-toolbar-tool-btn">
            <Icon name="arrow-down"/>
          </button>
        </div>
        <Dropdown
          toggle={{
            content: <Icon name="dots-vertical"/>,
            title: "More",
            className: "btn icon-btn icon-btn-alt"
          }}
          body={{ className: "viewer-toolbar-dropdown" }}>
          <div className="viewer-toolbar-dropdown-group">
            <label className="btn icon-text-btn dropdown-btn viewer-toolbar-dropdown-btn">
              <Icon name="upload"/>
              <span>Load File</span>
              <input type="file" onChange={handleFileUpload} className="sr-only" accept="application/pdf, application/epub+zip"/>
            </label>
          </div>
          {file.type === "pdf" && (
            <div className="viewer-toolbar-dropdown-group">
              <button id="js-viewer-rotate-btn" className="btn icon-text-btn dropdown-btn viewer-toolbar-dropdown-btn">
                <Icon name="rotate"/>
                <span>Rotate pages</span>
              </button>
            </div>
          )}
          <div id="js-viewer-view-modes" className="viewer-toolbar-dropdown-group">
            <button className="btn icon-text-btn dropdown-btn viewer-toolbar-dropdown-btn viewer-view-mode-btn" data-mode="single">
              <Icon name="page"/>
              <span>Single page</span>
            </button>
            <button className="btn icon-text-btn dropdown-btn viewer-toolbar-dropdown-btn viewer-view-mode-btn" data-mode="multi">
              <Icon name="pages"/>
              <span>Multi page</span>
            </button>
          </div>
          {file.type === "epub" && (
            <>
              <div className="viewer-toolbar-dropdown-group">
                <button className="btn icon-text-btn dropdown-btn viewer-toolbar-dropdown-btn" onClick={showMarginModal}>
                  <Icon name="margin"/>
                  <span>Set margin</span>
                </button>
              </div>
              <div id="js-viewer-spread-pages-setting"
                className={`viewer-toolbar-dropdown-group${settings.epub.viewMode === "multi" ? " hidden" : ""}`}>
                <label className="viewer-toolbar-settings-item">
                  <input type="checkbox" id="js-viewer-spread-pages" className="sr-only checkbox-input"/>
                  <div className="checkbox">
                    <div className="checkbox-tick"></div>
                  </div>
                  <span className="checkbox-label">Spread pages</span>
                </label>
              </div>
              <div className="viewer-toolbar-dropdown-group viewer-themes-container">
                <div className="viewer-themes-title">Themes</div>
                <div id="js-viewer-themes" className="viewer-themes">
                  <button className="btn viewer-theme-btn black" data-theme="black">A</button>
                  <button className="btn viewer-theme-btn white" data-theme="white">A</button>
                  <button className="btn viewer-theme-btn grey" data-theme="grey">A</button>
                  <button className="btn viewer-theme-btn orange" data-theme="orange">A</button>
                </div>
              </div>
            </>
          )}
          <div className={`viewer-toolbar-dropdown-group${file.type === "epub" && fileWarning.hide ? " hidden" : ""}`}>
            {file.type === "pdf" && (
              <>
                <label className="viewer-toolbar-settings-item">
                  <input type="checkbox" id="js-viewer-invert-colors" className="sr-only checkbox-input"/>
                  <div className="checkbox">
                    <div className="checkbox-tick"></div>
                  </div>
                  <span className="checkbox-label">Invert page colors</span>
                </label>
                <label className="viewer-toolbar-settings-item">
                  <input type="checkbox" className="sr-only checkbox-input"
                    name="keepToolbarVisible"
                    onChange={handleSettingChange}
                    checked={settings.keepToolbarVisible}/>
                  <div className="checkbox">
                    <div className="checkbox-tick"></div>
                  </div>
                  <span className="checkbox-label">Keep toolbar visible</span>
                </label>
              </>
            )}
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
          <button className="btn icon-text-btn viewer-toolbar-dropdown-btn" onClick={localExitViewer} title="Exit">
            <Icon name="exit"/>
            <span>Exit</span>
          </button>
        </Dropdown>
      </div>
    </div>
  );
}
