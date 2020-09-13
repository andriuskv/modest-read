import React, { useEffect } from "react";
import { setDocumentTitle } from "../../utils";
import BannerImage from "../BannerImage";
import "./no-match.scss";

export default function NoMatch({ message }) {
  useEffect(() => {
    setDocumentTitle("Page not found");
  }, [message]);

  return (
    <div className="no-match">
      <BannerImage/>
      <p className="no-match-message">The page you are looking for does not exist.</p>
    </div>
  );
}
