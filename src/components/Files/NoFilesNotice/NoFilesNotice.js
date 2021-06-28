import React from "react";
import Icon from "../../Icon";
import Notification from "../../Notification";
import BannerImage from "../../BannerImage";
import "./no-files-notice.scss";

export default function NoFilesNotice({ notification, dismiss, handleFileUpload }) {
  return (
    <div className="no-files-notice">
      <BannerImage/>
      <div className="no-files-notice-message-container">
        <p className="no-files-notice-message-main">You don't have any files.</p>
        <p className="no-files-notice-message">Drag and drop or click on a button to import.</p>
      </div>
      {notification && <Notification notification={notification} margin="bottom" dismiss={dismiss}/>}
      <label className="btn icon-text-btn primary-btn no-files-notice-btn">
        <Icon name="upload" size="24px"/>
        <span>Import Files</span>
        <input type="file" onChange={handleFileUpload} className="sr-only" accept="application/pdf, application/epub+zip" multiple/>
      </label>
    </div>
  );
}
