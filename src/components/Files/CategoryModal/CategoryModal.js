import { useState } from "react";
import Icon from "components/Icon";
import Modal from "components/Modal";
import ConfirmationModal from "components/ConfirmationModal";
import "./category-modal.css";

export default function CategoryModal({ modal, categories, assignCategory, changeCategoryOrder, removeCategory, createCategory, updateCategoryName, hide }) {
  const [nameModal, setNameModal] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState(null);

  function hideNameModal() {
    setNameModal(null);
  }

  function enableCategoryNameEdit(name, id) {
    setNameModal({
      action: "edit",
      categoryName: name,
      categoryId: id
    });
  }

  function handleFormSubmit(event) {
    const categoryName = event.target.elements.name.value;

    event.preventDefault();
    hideNameModal();

    if (!categoryName) {
      return;
    }

    if (nameModal.action === "edit") {
      if (categoryName !== nameModal.categoryName) {
        updateCategoryName(categoryName, nameModal.categoryId);
      }
    }
    else {
      createCategory(categoryName);
    }
  }

  function showConfirmationModal(id, name) {
    setConfirmationModal({
      iconId: "trash",
      title: "Remove category?",
      message: `Are you sure you want to remove the category "${name}"?`,
      actionName: "Remove",
      action: () => {
        removeCategory(id);
        hideConfirmationModal();
      }
    });
  }

  function hideConfirmationModal() {
    setConfirmationModal(null);
  }

  return (
    <Modal className="category-modal" hide={hide}>
      <div className="modal-title-container">
        <h3 className="modal-title">{modal.action === "set" ? "Set category" : "Categories"}</h3>
      </div>
      <ul className="category-modal-list">
        {categories.map((category, index) => (
          <li className="category-modal-list-item" key={category.id}>
            {modal.action === "set" ? (
              <button className={`btn text-btn-alt category-modal-list-item-btn${category.id === modal.categoryId ? " active" : ""}`}
                onClick={() => assignCategory(category.id)} disabled={category.id === modal.categoryId}>
                <span>{category.name}</span>
                <span>{category.files.length}</span>
              </button>
            ) : (
              <>
                <div className="category-modal-list-item-order-btn-container">
                  <button className="btn icon-btn" onClick={() => changeCategoryOrder(-1, category.id)}
                    disabled={index === 0} title="Move up">
                    <Icon id="arrow-up"/>
                  </button>
                  <button className="btn icon-btn" onClick={() => changeCategoryOrder(1, category.id)}
                    disabled={index === categories.length - 1} title="Move down">
                    <Icon id="arrow-down"/>
                  </button>
                </div>
                <button className="btn text-btn-alt category-modal-list-item-btn" onClick={() => enableCategoryNameEdit(category.name, category.id)} title="Rename">
                  <span>{category.name}</span>
                  <span>{category.files.length}</span>
                </button>
                {category.id === "default" ? null : (
                  <button className="btn icon-btn" onClick={() => showConfirmationModal(category.id, category.name)} title="Remove">
                    <Icon id="trash"/>
                  </button>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="modal-bottom category-modal-bottom">
        <button className="btn icon-text-btn primary-btn" onClick={() => setNameModal({})}>
          <Icon id="plus"/>
          <span>Add</span>
        </button>
        <button className="btn text-btn-alt" onClick={hide}>Cancel</button>
      </div>
      {nameModal ? (
        <Modal nested hide={hideNameModal}>
          <div className="modal-title-container">
            <h3 className="modal-title">{nameModal.action === "edit" ? "Rename" : "Create"} category</h3>
          </div>
          <form onSubmit={handleFormSubmit}>
            <div>
              <input type="text" className="input category-modal-input" name="name" required autoFocus defaultValue={nameModal.action === "edit" ? nameModal.categoryName : ""}/>
            </div>
            <div className="modal-bottom">
              <button type="button" className="btn text-btn-alt" onClick={hideNameModal}>Cancel</button>
              <button className="btn text-btn-alt">{nameModal.action === "edit" ? "Update" : "Create"}</button>
            </div>
          </form>
        </Modal>
      ) : null}
      {confirmationModal ? <ConfirmationModal {...confirmationModal} nested hide={hideConfirmationModal}/> : null}
    </Modal>
  );
}
