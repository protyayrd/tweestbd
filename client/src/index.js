import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './Redux/Store';
import { getCategories } from './Redux/Admin/Category/Action';


// Kick off critical data fetch early to reduce LCP delays
store.dispatch(getCategories());

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
    <Provider store={store}>
      <App />
    </Provider>
      
  
      
    </BrowserRouter>
    
  </React.StrictMode>
);

reportWebVitals();
