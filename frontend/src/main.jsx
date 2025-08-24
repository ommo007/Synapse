import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import * as Sentry from "@sentry/react";




Sentry.init({
  dsn: "https://c62bad3cd4292aada4796ff710bc0b8a@o4509594454851584.ingest.us.sentry.io/4509900031262720",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration()
  ],
  // Tracing
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/synapse-93g5\.onrender\.com\/api/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions will be recorded
  replaysOnErrorSampleRate: 1.0 // 100% of sessions with errors will be recorded
});

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  Sentry.captureException(event.error);
});

// Add unhandled rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  Sentry.captureException(event.reason);
});

// Log initial render for debugging
console.log('Starting application render...');
console.log("Starting React application...");

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

console.log("React application rendered.");