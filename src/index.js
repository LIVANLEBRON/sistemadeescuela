import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { setupGlobalErrorHandlers } from './utils/errorHandler';

const root = ReactDOM.createRoot(document.getElementById('root'));
setupGlobalErrorHandlers();
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);