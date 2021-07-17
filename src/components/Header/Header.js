import { Link } from "react-router-dom";
import { useUser } from "../../context/user-context";
import Dropdown from "../Dropdown";
import Icon from "../Icon";
import "./header.scss";

export default function Header({ className, shouldRenderUser = false }) {
  const { user, logoutUser } = useUser();

  function renderUser() {
    if (user.loading) {
      return null;
    }
    else if (user.email) {
      return (
        <Dropdown container={{ className: "header-user" }}
          toggle={{
            content: <Icon name="user" size="24px"/>,
            className: "btn icon-btn icon-btn-alt user-dropdown-toggle-btn",
            title: `Logged in as ${user.email}`
          }}
          body={{ className: "user-dropdown" }}>
          <div className="user-email-label">Logged in as</div>
          <div className="user-email">{user.email}</div>
          <div className="user-dropdown-group">
            <button className="btn user-logout-btn" onClick={logoutUser}>Log Out</button>
          </div>
        </Dropdown>
      );
    }
    return <Link to="/login" className="btn text-btn text-btn-alt header-user">Log In</Link>;
  }

  return (
    <header className={`header${className ? ` ${className}` : ""}`}>
      <h1 className="header-title">ModestRead</h1>
      {shouldRenderUser && renderUser()}
    </header>
  );
}
