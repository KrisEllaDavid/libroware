import "./i18n";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import { client } from "@/apollo-client";
import App from "@/App";
import "@/index.css";
import "@/global.css";
import LanguageSwitcher from "./components/common/LanguageSwitcher";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <BrowserRouter>
        <LanguageSwitcher />
        <App />
      </BrowserRouter>
    </ApolloProvider>
  </React.StrictMode>
);
