import {
  REGISTER_REQUEST,
  REGISTER_SUCCESS,
  REGISTER_FAILURE,
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  GET_USER_REQUEST,
  GET_USER_SUCCESS,
  GET_USER_FAILURE,
  LOGOUT,
  CLEAR_ERROR,
  VERIFY_ADMIN_ACCESS_REQUEST,
  VERIFY_ADMIN_ACCESS_SUCCESS,
  VERIFY_ADMIN_ACCESS_FAILURE
} from "./ActionTypes";

import {
  UPDATE_USER_PHONE_REQUEST,
  UPDATE_USER_PHONE_SUCCESS,
  UPDATE_USER_PHONE_FAILURE,
  SEND_OTP_REQUEST,
  SEND_OTP_SUCCESS,
  SEND_OTP_FAILURE,
  VERIFY_OTP_REQUEST,
  VERIFY_OTP_SUCCESS,
  VERIFY_OTP_FAILURE,
  UPDATE_USER_PROFILE_REQUEST,
  UPDATE_USER_PROFILE_SUCCESS,
  UPDATE_USER_PROFILE_FAILURE,
  CHANGE_PASSWORD_REQUEST,
  CHANGE_PASSWORD_SUCCESS,
  CHANGE_PASSWORD_FAILURE,
  ADMIN_RESET_PASSWORD_REQUEST,
  ADMIN_RESET_PASSWORD_SUCCESS,
  ADMIN_RESET_PASSWORD_FAILURE
} from "./Action";

const initialState = {
  user: null,
  isLoading: false,
  error: null,
  otpSent: false,
  otpVerified: false,
  requireOTPVerification: false,
  passwordChanged: false,
  isAdminVerified: false,
  adminVerificationLoading: false
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case REGISTER_REQUEST:
    case LOGIN_REQUEST:
    case UPDATE_USER_PHONE_REQUEST:
    case SEND_OTP_REQUEST:
    case VERIFY_OTP_REQUEST:
    case UPDATE_USER_PROFILE_REQUEST:
    case CHANGE_PASSWORD_REQUEST:
    case ADMIN_RESET_PASSWORD_REQUEST:
      return { ...state, isLoading: true, error: null, passwordChanged: false };
    case VERIFY_ADMIN_ACCESS_REQUEST:
      return { ...state, adminVerificationLoading: true, error: null, isAdminVerified: false };
    case REGISTER_SUCCESS:
      return { ...state, isLoading: false };
    case LOGIN_SUCCESS:
      return { 
        ...state, 
        isLoading: false,
        requireOTPVerification: action.payload.requireOTPVerification || false
      };
    case REGISTER_FAILURE:
    case LOGIN_FAILURE:
    case UPDATE_USER_PHONE_FAILURE:
    case SEND_OTP_FAILURE:
    case VERIFY_OTP_FAILURE:
    case UPDATE_USER_PROFILE_FAILURE:
    case CHANGE_PASSWORD_FAILURE:
    case ADMIN_RESET_PASSWORD_FAILURE:
      return { ...state, isLoading: false, error: action.payload };
    case VERIFY_ADMIN_ACCESS_FAILURE:
      return { ...state, adminVerificationLoading: false, error: action.payload, isAdminVerified: false };
    case GET_USER_REQUEST:
      return { ...state, isLoading: true, error: null };
    case GET_USER_SUCCESS:
      return { 
        ...state, 
        isLoading: false, 
        user: action.payload,
        requireOTPVerification: !action.payload.isOTPVerified
      };
    case VERIFY_ADMIN_ACCESS_SUCCESS:
      return { 
        ...state, 
        adminVerificationLoading: false, 
        isAdminVerified: action.payload.isAdmin,
        error: null
      };
    case UPDATE_USER_PHONE_SUCCESS:
      return { 
        ...state, 
        isLoading: false, 
        user: action.payload,
        requireOTPVerification: !action.payload.isOTPVerified
      };
    case UPDATE_USER_PROFILE_SUCCESS:
      return {
        ...state,
        isLoading: false,
        user: action.payload
      };
    case CHANGE_PASSWORD_SUCCESS:
    case ADMIN_RESET_PASSWORD_SUCCESS:
      return {
        ...state,
        isLoading: false,
        passwordChanged: true
      };
    case GET_USER_FAILURE:
      return { ...state, isLoading: false, error: action.payload };
    case LOGOUT:
      localStorage.removeItem("jwt");
      return { ...initialState };
    case SEND_OTP_SUCCESS:
      return { ...state, isLoading: false, otpSent: true };
    case VERIFY_OTP_SUCCESS:
      return { 
        ...state, 
        isLoading: false, 
        otpVerified: true,
        requireOTPVerification: false
      };
    case CLEAR_ERROR:
      return { 
        ...state, 
        error: null 
      };
    default:
      return state;
  }
};

export default authReducer;
