import { useEffect } from "react";
import { Link } from "react-router-dom";
import { setDocumentTitle } from "../../utils";
import BannerImage from "../BannerImage";
import Icon from "../Icon";
import "./no-match.scss";

export default function NoMatch() {
  useEffect(() => {
    setDocumentTitle("Page not found");
  }, []);

  return (
    <div className="no-match">
      <BannerImage/>
      <p className="no-match-message">The page you are looking for does not exist.</p>
      <Link to="/" className="btn icon-text-btn primary-btn">
        <Icon name="home" size="24px"/>
        <span>Home</span>
      </Link>
    </div>
  );
}
