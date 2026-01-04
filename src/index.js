// client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // If you don't have this file, delete this line
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);