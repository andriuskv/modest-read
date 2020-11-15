import { useState } from "react";
import Icon from "../../Icon";
import Notification from "../../Notification";
import "./drop-modal.scss";

export default function DropModal({ message, preferences, saveDroppedFile, hideDropModal, dismissNotification }) {
  const [hide, setHide] = useState(false);

  function toggleDropWarningSetting({ target }) {
    setHide(target.checked);
  }

  function save() {
    const preferences = {
      dropWarningHidden: hide,
      saveDroppedFile: true
    };

    saveDroppedFile(preferences);

    if (hide) {
      savePreferences(preferences);
    }
  }

  function hideDropWarning() {
    const preferences = {
      dropWarningHidden: hide,
      saveDroppedFile: false
    };

    hideDropModal(preferences);

    if (hide) {
      savePreferences(preferences);
    }
  }

  function savePreferences(preferences) {
    localStorage.setItem("viewer-preferences", JSON.stringify(preferences));
  }

  if (message.type === "negative") {
    return <Notification notification={message} className="viewer-drop-modal viewer-notification" dismiss={dismissNotification}/>;
  }
  else if (message.type === "warning" && !preferences.dropWarningHidden) {
    return (
      <div className="viewer-drop-modal viewer-drop-warning">
        <div className="viewer-drop-warning-mesasge-container">
          <Icon name="info" size="24px"/>
          <p className="viewer-drop-warning-mesasge">{message.value}</p>
        </div>
        <label className="checkbox-container viewer-drop-warning-checkbox-container">
          <input type="checkbox" className="sr-only checkbox-input" onChange={toggleDropWarningSetting}
            checked={hide}/>
          <div className="checkbox">
            <div className="checkbox-tick"></div>
          </div>
          <span className="checkbox-label">Don't show this message again.</span>
        </label>
        <div className="viewer-drop-warning-bottom">
          <button className="btn text-btn" onClick={hideDropWarning}>No</button>
          <button className="btn viewer-drop-warning-btn" onClick={save}>Yes</button>
        </div>
      </div>
    );
  }
  return null;
}
