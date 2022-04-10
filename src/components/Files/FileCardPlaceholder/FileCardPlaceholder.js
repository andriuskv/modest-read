import "./file-card-placeholder.css";

export default function FileCardPlaceholder() {
  return (
    <li className="file-card-placeholder">
      <div className="file-card-image-placeholder"></div>
      <div className="file-card-info-placeholder">
        <div className="file-card-title-placeholder"></div>
        <div className="file-card-author-placeholder"></div>
        <div className="file-card-secondary-info-placeholder">
          <div className="file-card-secondary-info-item-placeholder"></div>
          <div className="file-card-secondary-info-item-placeholder"></div>
        </div>
        <div className="file-card-progress-placeholder"></div>
        <div className="file-card-bottom-placeholder">
          <div className="file-card-bottom-btn-placeholder"></div>
        </div>
      </div>
    </li>
  );
}
