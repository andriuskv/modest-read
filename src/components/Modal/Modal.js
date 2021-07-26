import { useEffect } from "react";
import "./modal.scss";
import Icon from "../Icon";

export default function Modal({ iconId, title, message, actionName, action, hide }) {
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
    <div className="modal-mask" onClick={handleClick}>
      <div className="modal">
        <div className="modal-title-container">
          <Icon name={iconId} className="modal-title-icon"/>
          <h3 className="modal-title">{title}</h3>
        </div>
        <p>{message}</p>
        <div className="modal-bottom">
          <button className="btn text-btn" onClick={hide}>Cancel</button>
          <button className="btn icon-text-btn" onClick={action}>
            <Icon name={iconId}/>
            <span>{actionName}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
