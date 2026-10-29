
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app.jsx";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('PawLink AI could not find the root element in index.html.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
