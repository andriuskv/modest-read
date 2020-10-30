import React from "react";
import ReactDOM from "react-dom";

import "focus-visible";
import "normalize.css";
import "./styles/index.scss";

import App from "./components/App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

ReactDOM.render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>,
  document.getElementById("root")
);

serviceWorkerRegistration.unregister();
