import { useState, useEffect, useRef, useCallback } from "react";
import { getSettings, setSetting } from "../../../services/settingsService";
import Icon from "../../Icon";
import Dropdown from "../../Dropdown";
import FileInfo from "../FileInfo";
import "./toolbar.scss";

export default function Toolbar({ file, preferences, zoomOut, zoomIn, previousPage, nextPage, handleSelect, scrollToNewPage, updateSettings, changeViewMode, exitViewer }) {
  const [settings, setSettings] = useState(() => getSettings());
  const [pageNumber, setPageNumber] = useState(file.pageNumber);
  const keepVisible = useRef(false);
  const hideAfterScroll = useRef(file.scrollTop > 0);
  const toolbarRef = useRef(null);
  const toolbarScrollOffset = useRef(0);
  const scrolling = useRef(false);
  const movingMouse = useRef(false);
  const memoizedScrollHandler = useCallback(handleScroll, [file]);
  const memoizedMediaScrollHandler = useCallback(handleMatchedMediaScroll, [preferences.viewMode]);

  useEffect(() => {
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

  useEffect(() => {
    setPageNumber(file.pageNumber);
  }, [file.pageNumber]);

  function localPreviousPage() {
    keepVisible.current = true;
    previousPage();
  }

  function localNextPage() {
    keepVisible.current = true;
    nextPage();
  }

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

      if (scrollTop > file.scrollTop) {
        if (keepVisible.current) {
          keepVisible.current = false;
        }
        else {
          hideToolbar();
        }
      }
      else if (!scrollTop || toolbarScrollOffset.current > 100) {
        revealToolbar();
      }
      else {
        const scrollDiff = file.scrollTop - scrollTop;
        toolbarScrollOffset.current += scrollDiff;
      }
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
        if (preferences.viewMode === "multi") {
          revealToolbar();
        }
      }
      else if (hideAfterScroll.current) {
        hideToolbar();
      }
      else if (preferences.viewMode === "multi") {
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
      if (event.clientY < 80 &&
        event.clientX < document.documentElement.clientWidth &&
        toolbarRef.current.classList.contains("hidden")
      ) {
        toolbarRef.current.classList.remove("hidden");

        setTimeout(() => {
          toolbarRef.current.classList.remove("hiding");
        }, 200);
      }
      movingMouse.current = false;
    });
  }

  function handleClick({ target }) {
    const { scrollTop } = document.documentElement;

    if (!target.closest(".viewer-toolbar") && !target.closest(".btn")) {
      keepVisible.current = false;

      if (preferences.viewMode === "multi" && scrollTop < 40) {
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
  }

  function handleInputChange(event) {
    setPageNumber(event.target.value);
  }

  function handleInputBlur(event) {
    let number = parseInt(event.target.value, 10);

    if (Number.isNaN(number)) {
      number = file.pageNumber;
    }
    else if (number < 1) {
      number = 1;
    }
    else if (number > file.pageCount) {
      number = file.pageCount;
    }
    event.target.style.width = `${number.toString().length}ch`;

    if (number !== file.pageNumber) {
      keepVisible.current = true;
      scrollToNewPage(number);
    }
    setPageNumber(number);
  }

  function handleInputKeydown(event) {
    if (event.key === "Enter") {
      event.target.blur();
    }
  }

  function handleInputClick(event) {
    if (event.target !== event.currentTarget.firstElementChild) {
      event.currentTarget.firstElementChild.focus();
    }
  }

  function handleInputFocus(event) {
    const { pageCount } = file;
    const width = pageCount < 1000 ? 3 : pageCount.toString().length;
    event.target.style.width = `${width}ch`;
    event.target.select();
  }

  function handleSettingChange({ target }) {
    updateSettings(target.name, target.checked);
    setSettings({ ...settings, [target.name]: target.checked });
    setSetting(target.name, target.checked);
  }

  function localExitViewer() {
    window.removeEventListener("scroll", memoizedScrollHandler);
    window.removeEventListener("mousemove", handeMouseMove);
    exitViewer();
  }

  return (
    <div className={`viewer-toolbar${settings.keepToolbarVisible ? " keep-visible" : ""}`} ref={toolbarRef}>
      <FileInfo file={file}/>
      <div className="viewer-toolbar-tools">
        <div className="viewer-toolbar-zoom">
          <button className="btn icon-btn viewer-toolbar-tool-btn" onClick={zoomOut} title="Zoom out"
            disabled={file.scale.currentScale <= file.scale.minScale}>
            <Icon name="minus"/>
          </button>
          <select className="input viewer-toolbar-zoom-select" onChange={handleSelect} value={file.scale.name}>
            <option value="custom" style={{ display: "none" }}>{file.scale.displayValue}%</option>
            <option value="fit-width">Fit Width</option>
            <option value="fit-page">Fit Page</option>
            <option value="0.5">50%</option>
            <option value="0.75">75%</option>
            <option value="1">100%</option>
            <option value="1.5">150%</option>
            <option value="2">200%</option>
            <option value="3">300%</option>
            <option value="4">400%</option>
          </select>
          <button className="btn icon-btn viewer-toolbar-tool-btn" onClick={zoomIn} title="Zoom in"
            disabled={file.scale.currentScale >= file.scale.maxScale}>
            <Icon name="plus"/>
          </button>
        </div>
        <div className="viewer-toolbar-page">
          <button className="btn icon-btn viewer-toolbar-tool-btn"
            onClick={localPreviousPage} disabled={file.pageNumber <= 1}>
            <Icon name="arrow-up"/>
          </button>
          <div className="viewer-toolbar-page-input-container" onClick={handleInputClick}>
            <input type="text" inputMode="numeric" className="input viewer-toolbar-page-input" onChange={handleInputChange} value={pageNumber}
              onBlur={handleInputBlur} onFocus={handleInputFocus} onKeyDown={handleInputKeydown} style={{ width: `${file.pageNumber.toString().length}ch`}}/>
            <div>of {file.pageCount}</div>
          </div>
          <button className="btn icon-btn viewer-toolbar-tool-btn"
            onClick={localNextPage} disabled={file.pageNumber >= file.pageCount}>
            <Icon name="arrow-down"/>
          </button>
        </div>
      </div>
      <Dropdown
        container={{ className: "viewer-toolbar-dropdown-container" }}
        toggle={{
          content: <Icon name="dots-vertical"/>,
          title: "More",
          className: "btn icon-btn icon-btn-alt"
        }}
        body={{ className: "viewer-toolbar-dropdown" }}>
        <div>
          <button className={`btn icon-text-btn dropdown-btn viewer-view-mode-btn${preferences.viewMode === "multi" ? ` active` : ""}`}
            onClick={() => changeViewMode("multi")}>
            <Icon name="book"/>
            <span>Multi page</span>
          </button>
          <button className={`btn icon-text-btn dropdown-btn viewer-view-mode-btn${preferences.viewMode === "single" ? ` active` : ""}`}
            onClick={() => changeViewMode("single")}>
            <Icon name="book-check-mark"/>
            <span>Single page</span>
          </button>
        </div>
        <div className="viewer-toolbar-settings">
          <label className="viewer-toolbar-settings-item">
            <input type="checkbox" className="sr-only checkbox-input"
              name="invertColors"
              onChange={handleSettingChange}
              checked={settings.invertColors}/>
            <div className="checkbox">
              <div className="checkbox-tick"></div>
            </div>
            <span className="checkbox-label">Invert page colors.</span>
          </label>
          <label className="viewer-toolbar-settings-item">
            <input type="checkbox" className="sr-only checkbox-input"
              name="keepToolbarVisible"
              onChange={handleSettingChange}
              checked={settings.keepToolbarVisible}/>
            <div className="checkbox">
              <div className="checkbox-tick"></div>
            </div>
            <span className="checkbox-label">Keep toolbar visible.</span>
          </label>
        </div>
        <button className="btn icon-text-btn viewer-toolbar-exit-btn" onClick={localExitViewer} title="Exit">
          <Icon name="exit"/>
          <span>Exit Viewer</span>
        </button>
      </Dropdown>
    </div>
  );
}
