import "./header.scss";
import { Link } from "react-router-dom";

export default function Header({ className, shouldRenderUser = false }) {
  return (
    <header className={`header${className ? ` ${className}` : ""}`}>
      <h1 className="header-title">ModestRead</h1>
      {shouldRenderUser && (
        <Link to="/login" className="btn text-btn text-btn-alt header-user">Log in</Link>
      )}
    </header>
  );
}
