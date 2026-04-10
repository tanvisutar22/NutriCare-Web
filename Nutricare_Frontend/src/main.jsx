import { Toaster } from "react-hot-toast";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { store } from "./store";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: "12px",
                background: "rgba(8, 20, 45, 0.96)",
                color: "#e2e8f0",
                border: "1px solid rgba(148, 163, 184, 0.12)",
                backdropFilter: "blur(12px)",
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
