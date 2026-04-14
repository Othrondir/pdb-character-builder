import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from '@planner/router';
import '@planner/styles/fonts.css';
import '@planner/styles/tokens.css';
import '@planner/styles/app.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Missing #root mount point for planner app.');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
