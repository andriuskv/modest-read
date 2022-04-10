import { useState, useRef } from "react";
import Icon from "components/Icon";
import "./file-search.css";

export default function FileSearch({ searchFiles, resetSearch }) {
  const [searchValue, setSearchValue] = useState("");
  const searchTimeout = useRef(0);

  function handleSearchChange({ target }) {
    setSearchValue(target.value);

    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      searchFiles(target.value);
    }, 400);
  }

  function clearSearchInput() {
    resetSearch();
    setSearchValue("");
  }

  return (
    <div className="files-search">
      <Icon id="search" className="files-search-item files-search-icon"/>
      <input type="text" className="input files-search-input" placeholder="Search"
        onChange={handleSearchChange}
        value={searchValue}/>
      {searchValue && (
        <button className="btn icon-btn icon-btn-alt files-search-item files-search-btn"
          onClick={clearSearchInput}>
          <Icon id="close"/>
        </button>
      )}
    </div>
  );
}
