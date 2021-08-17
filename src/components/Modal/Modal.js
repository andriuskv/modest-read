import { useEffect } from "react";
import "./modal.scss";

export default function Modal({ children, hide }) {
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
      <div className="modal">{children}</div>
    </div>
  );
}
