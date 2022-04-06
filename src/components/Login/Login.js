import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setDocumentTitle } from "../../utils";
import { useUser } from "../../context/user-context";
import BannerImage from "../BannerImage";
import Notification from "../Notification";
import "./login.scss";

export default function Login() {
  const navigate = useNavigate();
  const { user, loginUser } = useUser();
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [notification, setNotification] = useState({});

  useEffect(() => {
    if (user.email) {
      navigate("/", { replace: true });
    }
    else {
      setDocumentTitle("Login");
    }
  }, [user.loading]);

  function showNotification(field, value) {
    setNotification({ field, value });
  }

  function hideNotification() {
    setNotification({});
  }

  async function handleLogin(event) {
    const { elements } = event.target;
    const { email: { value: email }, password: { value: password }} = elements;

    event.preventDefault();

    if (email.length < 6 || email.length > 320) {
      showNotification("email", "Invalid email.");
      return;
    }

    if (password.length < 6) {
      showNotification("password", "Password must be at least 6 characters.");
      return;
    }

    setSubmitDisabled(true);

    try {
      const data = await loginUser({ email, password });

      setSubmitDisabled(false);

      if (data.code === 200) {
        navigate("/", { replace: true });
      }
      else if (data.code === 500) {
        showNotification("form", "Something went wrong. Try again later.");
      }
      else {
        showNotification(data.field, data.message);
      }
    } catch (e) {
      console.log(e);
      setSubmitDisabled(false);
      showNotification("form", "Something went wrong. Try again later.");
    }
  }

  if (user.loading) {
    return null;
  }
  return (
    <>
      <BannerImage/>
      <div className="login-form-container">
        <form className="login-form" onSubmit={handleLogin}>
          <h2 className="login-form-title">Log In</h2>
          {notification.field === "form" && (
            <Notification margin="bottom"
              notification={notification}
              dismiss={hideNotification}/>
          )}
          <label className="login-form-field-group">
            <div className="login-form-field-name">Email</div>
            <input type="email" className="input login-form-field" name="email" required/>
          </label>
          {notification.field === "email" && (
            <div className="login-form-field-notification">{notification.value}</div>
          )}
          <label className="login-form-field-group">
            <div className="login-form-field-name">Password</div>
            <input type="password" className="input login-form-field" name="password" required/>
          </label>
          {notification.field === "password" && (
            <div className="login-form-field-notification">{notification.value}</div>
          )}
          <button className="btn login-form-submit-btn" disabled={submitDisabled}>{submitDisabled ? "Loging In..." : "Log In"}</button>
          <div className="login-form-bottom">
            Need an account? <Link to="/register" className="login-form-bottom-link">Sign Up</Link>.
          </div>
        </form>
      </div>
    </>
  );
}
