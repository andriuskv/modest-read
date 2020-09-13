import React, { useState, useEffect } from "react";
import "./notification.scss";
import { classNames } from "../../utils";
import Icon from "../Icon";

export default function Notification({ notification, expandable, margin, children, dismiss }) {
  const [state, setState] = useState(notification);
  const [expanded, setExpanded] = useState(false);
  const type = notification.type || "negative";

  useEffect(() => {
    if (!state.flashing && state !== notification) {
      if (state.value !== notification.value) {
        setState(notification);
        return;
      }
      setState({ ...state, flashing: true });

      setTimeout(() => {
        setState(notification);
      }, 640);
    }
  }, [state, notification]);

  function toggleExpanded() {
    setExpanded(!expanded);
  }

  return (
    <div className={classNames("notification", type, margin ? `margin-${margin}` : "", expanded ? "expanded" : "", state.flashing ? "flash" : "")}>
      <Icon name={type === "negative" ? "circle-cross" : "circle-check"} className="notification-icon" size="24px"/>
      {expandable ? (
        <div className="notification-expandable-content-container">
          <div className="notification-expandable-content">
            <span>{notification.value}</span>
            <button className="btn icon-btn notification-btn notification-expand-btn"
              onClick={toggleExpanded} title="Details"
              style={{ transform: `rotateZ(${expanded ? "180deg" : "0"})`}}>
              <Icon name="menu-down"/>
            </button>
          </div>
          {expanded && children}
        </div>
      ) : <span className="notification-text">{state.value}</span>}
      <button type="button" className="btn icon-btn notification-btn notification-dismiss-btn"
        onClick={dismiss} title="Dismiss">
        <Icon name="close"/>
      </button>
    </div>
  );
}
