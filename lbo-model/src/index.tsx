import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppWithLazyLoading from './AppWithLazyLoading';
import { initWebVitals } from './utils/reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AppWithLazyLoading />
  </React.StrictMode>
);

// Initialize Web Vitals monitoring
initWebVitals();
