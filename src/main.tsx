import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import Task from './Task.tsx'  // ← Asegúrate que importe Task

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Task />
  </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
}