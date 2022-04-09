import { Link } from "react-router-dom";
import Icon from "components/Icon";
import Notification from "components/Notification";
import BannerImage from "components/BannerImage";
import FileCard from "components/FileCard";
import Spinner from "../Spinner";
import "./file-preview.scss";

export default function FilePreview({ file, user, loading, notification, dismissNotification, handleFileUpload, loadPreviewFile }) {
  return (
    <div className="viewer-file-preview-container">
      <BannerImage/>
      <div className="viewer-file-preview">
        {notification?.type === "negative" && (
          <Notification notification={notification} margin="bottom" dismiss={dismissNotification}/>
        )}
        <FileCard file={file} user={user}>
          <Link to="/" className="btn icon-btn" title="Back to files">
            <Icon id="home" size="24px"/>
          </Link>
          <label className="btn viewer-file-preview-import-btn">
            <input type="file" onChange={handleFileUpload} className="sr-only" accept="application/pdf, application/epub+zip"/>
            <span>Select File</span>
          </label>
        </FileCard>
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
        {loading && <Spinner/>}
      </div>
    </div>
  );
}
