import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './app/store';
import { ThemeToggleProvider } from './ThemeToggleContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeToggleProvider>
          <App />
        </ThemeToggleProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
