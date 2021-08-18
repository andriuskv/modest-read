import { useEffect } from "react";
import { Link } from "react-router-dom";
import { setDocumentTitle } from "../../utils";
import Icon from "../Icon";
import BannerImage from "../BannerImage";
import "./error-page.scss";

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
          <Icon name={link.iconId} size="24px"/>
          <span>{link.text}</span>
        </Link>
      )}
    </div>
  );
}