import { useEffect } from "react";
import "./modal.css";

export default function Modal({ children, className, nested, hide }) {
  useEffect(() => {
    // Prevent page scroll when the modal is open
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeydown);

    return () => {
      if (!nested) {
        document.body.style.overflow = "";
      }
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
      <div className={`modal${className ? ` ${className}` : ""}`}>{children}</div>
    </div>
  );
}
