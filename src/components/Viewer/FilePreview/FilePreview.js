import { Link } from "react-router-dom";
import { dispatchCustomEvent } from "utils";
import Icon from "components/Icon";
import Notification from "components/Notification";
import BannerImage from "components/BannerImage";
import "./file-preview.css";
import Spinner from "../Spinner";

export default function FilePreview({ file, user, loading, notification, dismissNotification, loadPreviewFile }) {
  function handleFileInputChange(event) {
    dispatchCustomEvent("files", event.target.files);
    event.target.value = "";
  }

  return (
    <div className="viewer-preview-container">
      <BannerImage/>
      <div className="viewer-preview">
        {notification?.type === "negative" && (
          <Notification notification={notification} margin="bottom" dismiss={dismissNotification}/>
        )}
        <div className="viewer-preview-image-container">
          <img src={file.coverImage} className="viewer-preview-image" draggable="false" alt=""/>
        </div>
        <div>
          {file.author && <div className="viewer-preview-info-author">{file.author}</div>}
          <div className="viewer-preview-info-title">
            {file.local && user.email ? <Icon id="home" size="16px" className="file-card-local-icon"/> : null}
            <span>{file.title || file.name}</span>
          </div>
          <div className="viewer-preview-secondary-info">
            <div className="viewer-preview-info-filename">{file.name}</div>
            <div>{file.sizeString}</div>
          </div>
          {loading ? null : (
            <div className="viewer-preview-bottom">
              <Link to="/" className="btn icon-btn" title="Back to files">
                <Icon id="chevron-left" size="24px"/>
              </Link>
              <label className="btn viewer-preview-import-btn">
                <input type="file" onChange={handleFileInputChange} className="sr-only" accept="application/pdf, application/epub+zip"/>
                <span>Select File</span>
              </label>
            </div>
          )}
        </div>
        {notification?.type === "warning" && (
          <div className="viewer-file-preview-warning">
            <div className="viewer-file-preview-warning-main">
              <Icon id="info" className="viewer-file-preview-warning-icon" size="24px"/>
              <p className="viewer-file-preview-warning-message">{notification.value}</p>
            </div>
            <div className="viewer-file-preview-warning-bottom">
              <button className="btn text-btn viewer-file-preview-warning-btn" onClick={dismissNotification}>No</button>
              <button className="btn viewer-file-preview-warning-btn" onClick={loadPreviewFile}>Yes</button>
            </div>
          </div>
        )}
      </div>
      {loading && <Spinner className="viewer-preview-spinner" noMask/> }
    </div>
  );
}
