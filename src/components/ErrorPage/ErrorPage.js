import { useEffect } from "react";
import { Link } from "react-router-dom";
import { setDocumentTitle } from "utils";
import Icon from "components/Icon";
import BannerImage from "components/BannerImage";
import "./error-page.css";

export default function ErrorPage({ message, title, link }) {
  useEffect(() => {
    if (title) {
      setDocumentTitle(title);
    }
  }, []);

  return (
    <div className="error-page">
      <BannerImage/>
      <p className="error-page-message">{message}</p>
      {link && (
        <Link to={link.path} className="btn icon-text-btn primary-btn">
          <Icon id={link.iconId} size="24px"/>
          <span>{link.text}</span>
        </Link>
      )}
    </div>
  );
}
