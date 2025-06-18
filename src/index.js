// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import App from './App';

// Create root element
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

// Render app
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional: Remove initial loader if exists
const initialLoader = document.getElementById('initial-loader');
if (initialLoader) {
  setTimeout(() => {
    initialLoader.style.opacity = '0';
    setTimeout(() => {
      initialLoader.remove();
    }, 100);
  }, 100);
}