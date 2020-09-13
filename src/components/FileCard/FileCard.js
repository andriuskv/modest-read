import React from "react";
import { Link } from "react-router-dom";
import "./file-card.scss";

export default function FileCard({ file, showLink, children }) {
  return (
    <li className="file-card">
      {showLink ? (
        <Link to={`/viewer/${file.id}`} className="file-card-left" title={`Open ${file.name}`}>
          <img src={file.coverImage} className="file-card-image" alt=""/>
        </Link>
      ) : <img src={file.coverImage} className="file-card-left file-card-image" alt=""/>}
      <div className="file-card-info">
        <div className="file-card-title">{file.title || file.name}</div>
        {file.author && <div className="file-card-author">{file.author}</div>}
        <div className="file-card-secondary-info">
          {file.title && <div className="file-card-secondary-info-item file-card-filename">{file.name}</div>}
          <div className="file-card-secondary-info-item">{file.sizeString}</div>
        </div>
        <div className="file-card-progress-container"
          title={`${file.pageNumber} of ${file.pageCount} page${file.pageCount === 1 ? "" : "s"} read`}>
          <div className="file-card-progress">
            <div className="file-card-progress-bar" style={{ left: `${(file.pageNumber - 1) / file.pageCount * 100}%` }}></div>
          </div>
        </div>
        <div className="file-card-bottom">{children}</div>
      </div>
    </li>
  );
}
