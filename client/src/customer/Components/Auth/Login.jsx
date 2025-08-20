import * as React from "react";
import { Grid, TextField, Button, Box, Snackbar, Alert, Typography, Divider, CircularProgress } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getUser, login, clearError } from "../../../Redux/Auth/Action";
import { useEffect, useState } from "react";
import GoogleSignIn from "./GoogleSignIn";

export default function LoginUserForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const [openSnackBar, setOpenSnackBar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const { auth } = useSelector((store) => store);
  
  const handleCloseSnackbar = () => {
    setOpenSnackBar(false);
    if (auth.error) {
      dispatch(clearError());
    }
  };

  // Check for query parameters that might indicate login status
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    if (error) {
      setSnackbarMessage(error === 'auth_failed' ? 'Authentication failed' : error);
      setSnackbarSeverity('error');
      setOpenSnackBar(true);
    }
  }, [location]);

  useEffect(() => {
    if (jwt) {
      dispatch(getUser(jwt));
    }
  }, [jwt, dispatch]);

  useEffect(() => {
    if (auth.user) {
      setSnackbarMessage("Login successful!");
      setSnackbarSeverity("success");
      setOpenSnackBar(true);
      
      const timer = setTimeout(() => {
        if (auth.user.role === "ADMIN") {
          navigate("/admin");
        } else {
          // Check for returnTo parameter in the URL
          const params = new URLSearchParams(location.search);
          const returnTo = params.get('returnTo');
          
          if (returnTo) {
            navigate(returnTo);
          } else {
            const from = location.state?.from || "/cart";
            navigate(from);
          }
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [auth.user, navigate, location]);

  // Display error message
  useEffect(() => {
    if (auth.error) {
      setSnackbarMessage(auth.error);
      setSnackbarSeverity("error");
      setOpenSnackBar(true);
    }
  }, [auth.error]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const identifier = data.get("identifier");
    const isEmail = identifier.includes('@');
    
    const userData = {
      password: data.get("password"),
    };

    // Add either email or phone based on the identifier
    if (isEmail) {
      userData.email = identifier;
    } else {
      userData.phone = identifier;
    }

    try {
      await dispatch(login(userData));
    } catch (error) {
      // Error is already handled in the Redux flow
      console.error("Login error:", error);
    }
  };

  const textFieldStyles = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      backgroundColor: '#f8fafc',
      transition: 'all 0.2s ease-in-out',
      "&:hover": {
        backgroundColor: '#f1f5f9',
      },
      "&.Mui-focused": {
        backgroundColor: '#ffffff',
        "& fieldset": {
          borderColor: '#69af5a',
          borderWidth: 2,
        },
      },
    },
    "& .MuiInputLabel-root": {
      color: '#64748b',
      "&.Mui-focused": {
        color: '#00503a',
      },
    },
  };

  return (
    <Box>
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <img 
            src="/images/logo.png" 
            srcSet="/images/logo-300w.png 300w, /images/logo-600w.png 600w"
            sizes="189px"
            alt="Tweest BD" 
            style={{ height: '32px', width: '189px' }}
            loading="lazy"
            decoding="async"
          />
        </Box>
        <Typography
          variant="h4"
          component="h1"
          align="center"
          sx={{
            fontSize: { xs: '1.5rem', sm: '2rem' },
            fontWeight: 700,
            color: '#1a1a1a',
            mb: 1
          }}
        >
          Welcome back
        </Typography>
        <Typography
          variant="body1"
          align="center"
          sx={{
            color: '#64748b',
            mb: 2
          }}
        >
          Sign in to continue shopping
        </Typography>
      </Box>

      <GoogleSignIn />

      <Divider sx={{ 
        my: 3,
        "&::before, &::after": {
          borderColor: "rgba(0, 0, 0, 0.08)"
        }
      }}>
        <Typography 
          variant="body2" 
          sx={{
            color: "#64748b",
            px: 2
          }}
        >
          or continue with email
        </Typography>
      </Divider>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="identifier"
              name="identifier"
              label="Email or phone number"
              placeholder="Enter your email or phone number"
              autoComplete="email tel"
              size="large"
              sx={textFieldStyles}
              error={auth.error && auth.error.includes("Invalid")}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="password"
              name="password"
              label="Password"
              type="password"
              size="large"
              sx={textFieldStyles}
              error={auth.error && auth.error.includes("password")}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={auth.isLoading}
              sx={{
                mt: 1,
                py: 1.5,
                backgroundColor: "#18181b",
                borderRadius: 2,
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: "#00503a",
                },
              }}
            >
              {auth.isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Sign in"
              )}
            </Button>
          </Grid>
        </Grid>
      </form>

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Typography 
          variant="body2" 
          sx={{
            color: "#64748b",
          }}
        >
          Don&apos;t have an account?{" "}
          <Button
            onClick={() => navigate("/register")}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "#69af5a",
              "&:hover": {
                backgroundColor: "transparent",
                textDecoration: "underline",
              },
            }}
          >
            Sign up
          </Button>
        </Typography>
      </Box>

      <Snackbar 
        open={openSnackBar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ 
            width: "100%",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
