import React from "react";
import { Link } from "react-router-dom";
import Icon from "../../Icon";
import Notification from "../../Notification";
import BannerImage from "../../BannerImage";
import FileCard from "../../FileCard";
import "./file-preview.scss";

export default function FilePreview({ file, notification, dismissNotification, handleFileUpload, loadNewFile }) {
  return (
    <div className="viewer-file-preview-container">
      <BannerImage/>
      <div className="viewer-file-preview">
        {notification?.type === "negative" && (
          <Notification notification={notification} margin="bottom" dismiss={dismissNotification}/>
        )}
        <FileCard file={file}>
          <Link to="/" className="btn icon-btn" title="Back to files">
            <Icon name="bookshelf" size="24px"/>
          </Link>
          <label className="btn viewer-file-preview-import-btn">
            <input type="file" onChange={handleFileUpload} className="sr-only" accept="application/pdf"/>
            <span>Select File</span>
          </label>
        </FileCard>
        {notification?.type === "warning" && (
          <div className="viewer-file-preview-warning">
            <div className="viewer-file-preview-warning-main">
              <Icon name="info" className="viewer-file-preview-warning-icon" size="24px"/>
              <p className="viewer-file-preview-warning-message">{notification.value}</p>
            </div>
            <div className="viewer-file-preview-warning-bottom">
              <button className="btn text-btn viewer-file-preview-warning-btn" onClick={dismissNotification}>No</button>
              <button className="btn viewer-file-preview-warning-btn" onClick={loadNewFile}>Yes</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
