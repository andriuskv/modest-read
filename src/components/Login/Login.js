import { useEffect } from "react";
import { Link } from "react-router-dom";
import { setDocumentTitle } from "../../utils";
import BannerImage from "../BannerImage";
import "./login.scss";

export default function Login() {
  useEffect(() => {
    setDocumentTitle("Login");
  }, []);

  return (
    <>
      <BannerImage/>
      <div className="login-form-container">
        <div className="login-form">
          <h2 className="login-form-title">Log In</h2>
          <label className="login-form-field-group">
            <div className="login-form-field-name">Email</div>
            <input type="email" className="input login-form-field" name="email" required/>
          </label>
          <label className="login-form-field-group">
            <div className="login-form-field-name">Password</div>
            <input type="password" className="input login-form-field" name="password" required/>
          </label>
          <button className="btn">
            <span>Log in</span>
          </button>
          <div className="login-form-bottom">
            Need an account? <Link to="/register" className="login-form-bottom-link">Sign Up</Link>.
          </div>
        </div>
      </div>
    </>
  );
}
