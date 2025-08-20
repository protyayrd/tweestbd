import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUser } from '../Redux/Auth/Action';

export const useAuthMiddleware = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(state => state.auth.user !== null);

  useEffect(() => {
    // Check if there's a JWT token in localStorage
    const jwt = localStorage.getItem('jwt');
    if (jwt && !isAuthenticated) {
      // If we have a token but no user state, fetch user data
      dispatch(getUser(jwt));
    }
  }, [dispatch, isAuthenticated]);

  return isAuthenticated;
};
