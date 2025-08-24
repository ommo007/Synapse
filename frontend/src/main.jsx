import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import * as Sentry from "@sentry/react";
Sentry.init({
  dsn: "https://c62bad3cd4292aada4796ff710bc0b8a@o4509594454851584.ingest.us.sentry.io/4509900031262720",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

