import { createTheme } from "@mui/material/styles";

const customTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: '#9155FD',
      light: '#B985FF',
      dark: '#6B2FD3',
      contrastText: '#fff'
    },
    secondary: {
      main: '#f48fb1',
      light: '#F7B7D0',
      dark: '#D16F92',
      contrastText: '#000'
    },
    background: {
      default: '#121019',
      paper: "rgb(0, 0, 22)"
    },
    text: {
      primary: '#fff',
      secondary: 'rgba(255, 255, 255, 0.7)'
    },
    action: {
      hover: 'rgba(145, 85, 253, 0.08)'
    }
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#9155FD',
      light: '#B985FF',
      dark: '#6B2FD3',
      contrastText: '#fff'
    },
    secondary: {
      main: '#f48fb1',
      light: '#F7B7D0',
      dark: '#D16F92',
      contrastText: '#000'
    },
    background: {
      default: '#121019',
      paper: '#1a1325'
    },
    text: {
      primary: '#fff',
      secondary: 'rgba(255, 255, 255, 0.7)'
    },
    action: {
      hover: 'rgba(145, 85, 253, 0.08)'
    }
  },
});

const customerTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: '#9155FD',
      light: '#B985FF',
      dark: '#6B2FD3',
      contrastText: '#fff'
    },
    secondary: {
      main: '#f48fb1',
      light: '#F7B7D0',
      dark: '#D16F92',
      contrastText: '#000'
    },
    background: {
      default: '#f5f5f5',
      paper: "#ffffff"
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)'
    },
    action: {
      hover: 'rgba(145, 85, 253, 0.08)'
    }
  },
});

export {customTheme, darkTheme, customerTheme};
