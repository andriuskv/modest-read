import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import "./file-info.css";

export default function FileInfo({ file }) {
  function renderTitle() {
    let title = "";

    if (file.title) {
      title = file.title;

      if (file.author) {
        title += ` by ${file.author}`;
      }
    }
    else {
      title = file.name;
    }
    return (
      <>
        <div className={`file-info-item file-info-title${title === file.name ? ` filename` : ""}`}>{title}</div>
        {title !== file.name && <div className="file-info-item file-info-filename">{file.name}</div>}
      </>
    );
  }

  return (
    <Dropdown
      toggle={{
        content: <Icon id="info"/>,
        title: "Information",
        className: "btn icon-btn icon-btn-alt"
      }}
      body={{ className: "file-info" }}>
      <div className="file-info-image-container">
        <img src={file.coverImage} className="file-info-image" alt=""/>
      </div>
      <div className="file-info-items">
        {renderTitle()}
        <div className="file-info-item file-info-secondary">
          <span>{file.pageCount} pages</span>
          <span>{file.sizeString}</span>
          <span>{file.type}</span>
        </div>
      </div>
    </Dropdown>
  );
}
