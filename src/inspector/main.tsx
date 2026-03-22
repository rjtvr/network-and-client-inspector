import React from "react";
import ReactDOM from "react-dom/client";
import { InspectorApp } from "./inspector-app";
import "../styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <InspectorApp />
  </React.StrictMode>
);
