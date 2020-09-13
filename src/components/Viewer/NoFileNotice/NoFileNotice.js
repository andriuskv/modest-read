import React from "react";
import { Link } from "react-router-dom";
import Icon from "../../Icon";
import BannerImage from "../../BannerImage";
import "./no-file-notice.scss";

export default function NoFileNotice() {
  return (
    <div className="no-file-notice">
      <BannerImage/>
      <p className="no-file-notice-message">File not found.</p>
      <Link to="/" className="btn icon-text-btn primary-btn">
        <Icon name="bookshelf" size="24px"/>
        <span>Back to Files</span>
      </Link>
    </div>
  );
}
