import React from "react";
import Icon from "../../Icon";
import Dropdown from "../../Dropdown";
import "./file-info.scss";

export default function FileInfo({ file }) {
  return (
    <Dropdown
      toggle={{
        content: <Icon name="info"/>,
        title: "Information",
        className: "btn icon-btn icon-btn-alt"
      }}
      body={{ className: "file-info" }}>
      <img src={file.coverImage} className="file-info-image" alt=""/>
      <div>
        <div className="file-info-details-item">
          <span>File name:</span>
          <span>{file.name}</span>
        </div>
        <div className="file-info-details-item">
          <span>File size:</span>
          <span>{file.sizeString}</span>
        </div>
        <div className="file-info-details-item">
          <span>Title: </span>
          <span>{file.title || "-"}</span>
        </div>
        <div className="file-info-details-item">
          <span>Author:</span>
          <span>{file.author || "-"}</span>
        </div>
        <div className="file-info-details-item">
          <span>Page count:</span>
          <span>{file.pageCount}</span>
        </div>
      </div>
    </Dropdown>
  );
}
