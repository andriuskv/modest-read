import "./files-sort.scss";
import Icon from "../../Icon";
import Dropdown from "../../Dropdown";

export default function FilesSort({ sortBy, sortOrder, sortFileCatalog }) {
  function changeSortOrder({ target }) {
    sortFileCatalog(sortBy, Number(target.value));
  }

  return (
    <Dropdown
      toggle={{
        content: (
          <>
            <Icon name="sort" size="24px"/>
            <span>Sort</span>
          </>
        ),
        className: "btn icon-text-btn files-sort-dropdown-toggle-btn"
      }}
      body={{ className: "files-sort-dropdown" }}>
      <div className="files-sort-dropdown-group">
        <button className={`btn text-btn dropdown-btn files-sort-dropdown-btn${sortBy === "file-name" ? " active" : ""}`}
          onClick={() => sortFileCatalog("file-name")}>File name</button>
        <button className={`btn text-btn dropdown-btn files-sort-dropdown-btn${sortBy === "file-size" ? " active" : ""}`}
          onClick={() => sortFileCatalog("file-size")}>File size</button>
        <button className={`btn text-btn dropdown-btn files-sort-dropdown-btn${sortBy === "last-accessed" ? " active" : ""}`}
          onClick={() => sortFileCatalog("last-accessed")}>Last accessed</button>
      </div>
      <div className="files-sort-dropdown-group">
        <label className="dropdown-btn files-sort-dropdown-radio">
          <input type="radio" className="sr-only radio-input"
            name="sortOrder" value="1"
            onChange={changeSortOrder}
            checked={sortOrder === 1}/>
          <div className="radio"></div>
          <span className="radio-label">Ascending</span>
        </label>
        <label className="dropdown-btn files-sort-dropdown-radio">
          <input type="radio" className="sr-only radio-input"
            onChange={changeSortOrder}
            name="sortOrder" value="-1"
            checked={sortOrder === -1}/>
          <div className="radio"></div>
          <span className="radio-label">Descending</span>
        </label>
      </div>
    </Dropdown>
  );
}
