import { useEffect } from "react";
import "./files-modal.scss";
import Icon from "../../Icon";

export default function FilesModal({ type, iconId, title, message, action, hide, resetProgress, removeFile }) {
  const callback = type === "reset" ? resetProgress : removeFile;

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  function handleClick(event) {
    if (event.target === event.currentTarget) {
      hide();
    }
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      hide();
    }
  }

  return (
    <div className="files-modal" onClick={handleClick}>
      <div className="files-modal-content">
        <div className="files-modal-title-container">
          <Icon name={iconId} className="files-modal-title-icon"/>
          <h3 className="files-modal-title">{title}</h3>
        </div>
        <p>{message}</p>
        <div className="files-modal-content-bottom">
          <button className="btn text-btn" onClick={hide}>Cancel</button>
          <button className="btn icon-text-btn" onClick={callback}>
            <Icon name={iconId}/>
            <span>{action}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
