import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 忽略Plotly.js的源码映射警告
const originalConsoleWarn = console.warn;
console.warn = function(msg) {
  if (msg.includes('Failed to parse source map') && 
      (msg.includes('plotly.js') || msg.includes('maplibre-gl'))) {
    return;
  }
  originalConsoleWarn.apply(console, arguments);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 