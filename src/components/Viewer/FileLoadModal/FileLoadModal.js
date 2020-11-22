import { useState, useEffect, useRef } from "react";
import Icon from "../../Icon";
import Notification from "../../Notification";
import "./file-load-modal.scss";

export default function FileLoadModal({ message, preferences, saveFileLoadModalFile, hideFileLoadModal, hideFileLoadMessage, dismissNotification }) {
  const [hide, setHide] = useState(false);
  const timeoutId = useRef(0);

  useEffect(() => {
    clearTimeout(timeoutId.current);

    if (!message.duration) {
      return;
    }
    timeoutId.current = setTimeout(() => {
      hideFileLoadMessage();
    }, message.duration);

    return () => {
      clearTimeout(timeoutId.current);
    };
  }, [message]);

  function toggleHideWarninSetting({ target }) {
    setHide(target.checked);
  }

  function save() {
    changeFileSaveStatus(true);
  }

  function hideFileLoadWarning() {
    changeFileSaveStatus(false);
  }

  function changeFileSaveStatus(saveFile) {
    const updatedPreferences = {
      ...preferences,
      hideWarning: hide,
      saveLoadedFile: saveFile
    };

    if (saveFile) {
      saveFileLoadModalFile(updatedPreferences);
    }
    else {
      hideFileLoadModal(updatedPreferences);
    }

    if (hide) {
      savePreferences(updatedPreferences);
    }
  }

  function savePreferences(preferences) {
    localStorage.setItem("viewer-preferences", JSON.stringify(preferences));
  }

  if (message.type === "negative") {
    return <Notification notification={message} className="viewer-file-load-modal viewer-notification" dismiss={dismissNotification}/>;
  }
  else if (message.type === "warning" && !preferences.hideWarning) {
    return (
      <div className="viewer-file-load-modal viewer-file-load-warning">
        <div className="viewer-file-load-warning-mesasge-container">
          <Icon name="info" size="24px"/>
          <p className="viewer-file-load-warning-mesasge">{message.value}</p>
        </div>
        <label className="checkbox-container viewer-file-load-warning-checkbox-container">
          <input type="checkbox" className="sr-only checkbox-input" onChange={toggleHideWarninSetting}
            checked={hide}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
          <span className="checkbox-label">Don't show this message again.</span>
        </label>
        <div className="viewer-file-load-warning-bottom">
          <button className="btn text-btn" onClick={hideFileLoadWarning}>No</button>
          <button className="btn viewer-file-load-warning-btn" onClick={save}>Yes</button>
        </div>
      </div>
    );
  }
  return null;
}
