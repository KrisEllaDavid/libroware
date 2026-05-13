import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import { client, initCache } from "@/apollo-client";
import App from "@/App";
import "@/i18n";
import "@/index.css";
import "@/global.css";

// Hydrate the Apollo cache from IndexedDB before first render.
// The splash screen (5 s) gives more than enough time for this to complete.
initCache().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ApolloProvider client={client}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ApolloProvider>
    </React.StrictMode>
  );
});
