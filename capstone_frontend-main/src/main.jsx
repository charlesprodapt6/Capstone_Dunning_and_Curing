import React, { useMemo, useState, createContext } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export const ThemeModeContext = createContext();

const cottonCandy = {
  palette: {
    mode: 'light',
    primary: { main: '#fff' },
    secondary: { main: '#ff69b4', light: '#ffa6c9', dark: '#c2185b' },
    background: {
      default: '#fff',
      paper: '#fff8fb',
    },
    text: {
      primary: '#222',
      secondary: '#ff69b4',
    },
    customChart: {
      main: '#ff69b4',
      accent: '#ffa6c9',
    },
  },
  shape: { borderRadius: 12 },
};

const samurai = {
  palette: {
    mode: 'light',
    primary: { main: '#fff' },
    secondary: { main: '#111' },
    error: { main: '#c62828' },
    warning: { main: '#ffa726' },
    background: {
      default: '#fff',
      paper: '#fafafa',
    },
    text: {
      primary: '#111',
      secondary: '#c62828',
    },
    customChart: {
      main: '#c62828',
      accent: '#212121',
    },
  },
  shape: { borderRadius: 12 },
};

function ThemeRoot() {
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('themeMode') || 'cottonCandy');

  const theme = useMemo(() => createTheme(themeMode === 'samurai' ? samurai : cottonCandy), [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => {
      const next = prev === 'cottonCandy' ? 'samurai' : 'cottonCandy';
      localStorage.setItem('themeMode', next);
      return next;
    });
  };

  return (
    <ThemeModeContext.Provider value={{ themeMode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeRoot />
  </React.StrictMode>
);
