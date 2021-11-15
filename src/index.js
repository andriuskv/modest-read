import { StrictMode } from "react";
import ReactDOM from "react-dom";

import "focus-visible";
import "normalize.css";
import "./styles/index.scss";

import App from "./components/App";

ReactDOM.render(
  <StrictMode>
    <App/>
  </StrictMode>,
  document.getElementById("root")
);

if (process.env.NODE_ENV === "production") {
  navigator.serviceWorker.register("./sw.js").catch(console.log);
}
