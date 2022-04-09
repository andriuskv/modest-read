import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setDocumentTitle } from "utils";
import { useUser } from "contexts/user-context";
import BannerImage from "components/BannerImage";
import Notification from "components/Notification";
import "./register.scss";

export default function Register() {
  const navigate = useNavigate();
  const { user, registerUser } = useUser();
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [notification, setNotification] = useState({});

  useEffect(() => {
    if (user.email) {
      navigate("/", { replace: true });
    }
    else {
      setDocumentTitle("Register");
    }
  }, [user.loading]);

  function showNotification(field, value) {
    setNotification({ field, value });
  }

  function hideNotification() {
    setNotification({});
  }

  async function handleRegistration(event) {
    const { elements } = event.target;
    const { email: {value: email }} = elements;
    const [{ value: password }, { value: repeatedPassword }] = elements.password;

    event.preventDefault();

    if (email.length < 6 || email.length > 320) {
      showNotification("email", "Invalid email.");
      return;
    }

    if (password.length < 6) {
      showNotification("password", "Password must be at least 6 characters.");
      return;
    }

    if (repeatedPassword.length < 6) {
      showNotification("repeatedPassword", "Password must be at least 6 characters.");
      return;
    }

    if (password !== repeatedPassword) {
      showNotification("password", "Passwords don't match.");
      return;
    }

    setSubmitDisabled(true);

    try {
      const data = await registerUser({ email, password, repeatedPassword });

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
      <div className="register-form-container">
        <form className="register-form" onSubmit={handleRegistration}>
          <h2 className="register-form-title">Sign Up</h2>
          {notification.field === "form" && (
            <Notification margin="bottom"
              notification={notification}
              dismiss={hideNotification}/>
          )}
          <label className="register-form-field-group">
            <div className="register-form-field-name">Email</div>
            <input type="email" className="input register-form-field" name="email" required/>
          </label>
          {notification.field === "email" && (
            <div className="register-form-field-notification">{notification.value}</div>
          )}
          <label className="register-form-field-group">
            <div className="register-form-field-name">Password</div>
            <input type="password" className="input register-form-field" name="password" required/>
          </label>
          {notification.field === "password" && (
            <div className="register-form-field-notification">{notification.value}</div>
          )}
          <label className="register-form-field-group">
            <div className="register-form-field-name">Repeat password</div>
            <input type="password" className="input register-form-field" name="password" required/>
          </label>
          {notification.field === "repeatedPassword" && (
            <div className="register-form-field-notification">{notification.value}</div>
          )}
          <button className="btn register-form-submit-btn" disabled={submitDisabled}>{submitDisabled ? "Signing Up..." : "Sign Up"}</button>
          <div className="register-form-bottom">
            Already an user? <Link to="/login" className="register-form-bottom-link">Log in</Link>.
          </div>
        </form>
      </div>
    </>
  );
}
