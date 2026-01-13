import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { isFirebaseConfigured } from "./lib/firebase";
import { logger } from "./lib/logger";

// Production security: Clear demo data and require Firebase
if (import.meta.env.PROD) {
  // Clear any demo/development data from localStorage
  localStorage.removeItem('crimsoncare_users');
  localStorage.removeItem('crimsoncare_sos_requests');
  localStorage.removeItem('crimsoncare_donations');
  
  // In production, Firebase must be configured
  if (!isFirebaseConfigured) {
    logger.error('Firebase configuration required for production');
    document.body.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui;">
        <h1 style="color: #dc2626;">Configuration Required</h1>
        <p>This application requires proper backend configuration to run in production.</p>
        <p style="color: #6b7280; font-size: 0.875rem;">Please configure Firebase environment variables.</p>
      </div>
    `;
    throw new Error('Firebase configuration required for production mode');
  }
}

createRoot(document.getElementById("root")!).render(<App />);
