import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { dispatchCustomEvent } from "utils";
import "./dropdown.css";

export default function Dropdown({ container, toggle, body, children }) {
  const [state, setState] = useState({ id: uuidv4() });
  const memoizedWindowClickHandler = useCallback(handleWindowClick, [state.id]);
  const isMounted = useRef(false);
  const drop = useRef(null);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      window.removeEventListener("click", memoizedWindowClickHandler);
    };
  }, [memoizedWindowClickHandler]);

  useLayoutEffect(() => {
    if (state.reveal) {
      const viewportHeight = document.documentElement.offsetHeight;
      const height = drop.current.getBoundingClientRect().height;

      setState({
        ...state,
        onTop: state.top + height > viewportHeight,
        visible: true
      });
      dispatchCustomEvent("dropdown-visible", {
        id: state.id,
        hide: () => setState({ id: state.id, visible: false, reveal: false })
      });
    }
  }, [state.reveal]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleDropdown({ currentTarget }) {
    let top = 0;

    if (state.visible) {
      window.removeEventListener("click", memoizedWindowClickHandler);
    }
    else {
      window.addEventListener("click", memoizedWindowClickHandler);
      top = currentTarget.getBoundingClientRect().bottom;
    }
    setState({
      id: state.id,
      visible: false,
      reveal: !state.visible,
      top,
      onTop: false
    });
  }

  function handleWindowClick({ target }) {
    const closestContainer = target.closest(".dropdown-container");
    let hideDropdown = true;

    if (closestContainer?.id === state.id) {
      if (target.closest("[data-dropdown-keep]")) {
        hideDropdown = false;
      }
      else {
        hideDropdown = target.closest("a") || target.closest(".dropdown-btn");
      }
    }

    if (hideDropdown) {
      if (isMounted.current) {
        setState({ id: state.id, visible: false, reveal: false });
      }
      window.removeEventListener("click", memoizedWindowClickHandler);
    }
  }

  return (
    <div id={state.id} className={`dropdown-container${container ? ` ${container.className}` : ""}`}>
      <button onClick={toggleDropdown}
        title={toggle.title}
        className={`${toggle.className}${state.visible ? " active" : ""}`}>
        {toggle.content}
      </button>
      <div ref={drop} className={`dropdown${body ? ` ${body.className}` : ""}${state.reveal ? " reveal" : ""}${state.visible ? " visible" : ""}${state.onTop ? " top" : ""}`}>{children}</div>
    </div>
  );
}
