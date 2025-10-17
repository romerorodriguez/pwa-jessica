import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    })
    .then((registration) => {
      console.log('SW registrado:', registration);
    })
    .catch((error) => {
      console.log('Error SW:', error);
    });
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('SW registrado correctamente:', registration);
      })
      .catch((error) => {
        console.log('Error en SW:', error);
      });
  });
}