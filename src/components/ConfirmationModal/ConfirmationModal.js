import Modal from "components/Modal";
import Icon from "components/Icon";

export default function ConfirmationModal({ iconId, title, message, actionName, action, hide }) {
  return (
    <Modal hide={hide}>
      <div className="modal-title-container">
        <Icon id={iconId} className="modal-title-icon"/>
        <h3 className="modal-title">{title}</h3>
      </div>
      <p>{message}</p>
      <div className="modal-bottom">
        <button className="btn text-btn" onClick={hide}>Cancel</button>
        <button className="btn icon-text-btn" onClick={action}>
          <Icon id={iconId}/>
          <span>{actionName}</span>
        </button>
      </div>
    </Modal>
  );
}
