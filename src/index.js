import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "focus-visible";
import "normalize.css";
import "./styles/index.scss";

import App from "./components/App";

const root = createRoot(document.getElementById("root"));

root.render(
  <StrictMode>
    <App/>
  </StrictMode>
);

if (process.env.NODE_ENV === "production") {
  navigator.serviceWorker.register("./sw.js").catch(console.log);
}
