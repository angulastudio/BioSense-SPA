import React, { createContext, useMemo, useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useMediaQuery } from '@mui/material';
import { ThemeProvider as Emotion10Provider } from '@emotion/react';
import { Global, css } from '@emotion/react';

export const ThemeContext = createContext();

const ThemeContextProvider = ({ children }) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                backgroundColor: darkMode ? '#303030' : '#ffffff',
              },
            },
          },
        },
      }),
    [darkMode]
  );

  const globalStyles = css`
    body {
      background-color: ${darkMode ? '#303030' : '#ffffff'};
    }
  `;

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <Emotion10Provider theme={theme}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Global styles={globalStyles} />
          {children}
        </ThemeProvider>
      </Emotion10Provider>
    </ThemeContext.Provider>
  );
};

export default ThemeContextProvider;