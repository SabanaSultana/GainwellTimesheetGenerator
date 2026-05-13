import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import router from './routes/index.jsx';
import { RouterProvider } from 'react-router-dom';
import { project_name } from './config/project';

document.title = project_name;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
