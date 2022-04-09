import { createRoot } from "react-dom/client";

import "./styles/index.scss";

import App from "components/App";

const root = createRoot(document.getElementById("root"));

root.render(<App/>);

if (process.env.NODE_ENV === "production") {
  navigator.serviceWorker.register("./sw.js").catch(console.log);
}
