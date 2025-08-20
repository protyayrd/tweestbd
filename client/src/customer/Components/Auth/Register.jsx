import { Grid, TextField, Button, Box, Snackbar, Alert, Typography, Divider, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getUser, register, clearError } from "../../../Redux/Auth/Action";
import { Fragment, useEffect, useState } from "react";
import GoogleSignIn from "./GoogleSignIn";

export default function RegisterUserForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [openSnackBar, setOpenSnackBar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const { auth } = useSelector((store) => store);
  const [formErrors, setFormErrors] = useState({});

  const handleCloseSnackbar = () => {
    setOpenSnackBar(false);
    if (auth.error) {
      dispatch(clearError());
    }
  };

  const jwt = localStorage.getItem("jwt");

  useEffect(() => {
    if (jwt) {
      dispatch(getUser(jwt));
    }
  }, [jwt, dispatch]);

  useEffect(() => {
    if (auth.user) {
      setSnackbarMessage("Registration successful! Redirecting to homepage...");
      setSnackbarSeverity("success");
      setOpenSnackBar(true);
      
      const timer = setTimeout(() => {
        navigate("/");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [auth.user, navigate]);

  // Display error message
  useEffect(() => {
    if (auth.error) {
      setSnackbarMessage(auth.error);
      setSnackbarSeverity("error");
      setOpenSnackBar(true);
    }
  }, [auth.error]);

  const validateForm = (data) => {
    const errors = {};
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    // Phone validation (Bangladesh format)
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(data.phone)) {
      errors.phone = "Please enter a valid Bangladeshi phone number (e.g., 017XXXXXXXX)";
    }

    // Password validation
    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (data.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const userData = {
      firstName: data.get("firstName"),
      lastName: data.get("lastName"),
      email: data.get("email"),
      phone: data.get("phone"),
      password: data.get("password"),
      confirmPassword: data.get("confirmPassword"),
    };

    const errors = validateForm(userData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Clear previous form errors
    setFormErrors({});

    // Remove confirmPassword before sending to API
    delete userData.confirmPassword;
    
    try {
      await dispatch(register(userData));
    } catch (error) {
      // Error is already handled in the Redux flow
      console.error("Registration error:", error);
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
          Create an account
        </Typography>
        <Typography
          variant="body1"
          align="center"
          sx={{
            color: '#64748b',
            mb: 2
          }}
        >
          Join us to start shopping
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
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              id="firstName"
              name="firstName"
              label="First name"
              autoComplete="given-name"
              size="large"
              sx={textFieldStyles}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              id="lastName"
              name="lastName"
              label="Last name"
              autoComplete="family-name"
              size="large"
              sx={textFieldStyles}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="email"
              name="email"
              label="Email address"
              autoComplete="email"
              size="large"
              error={!!formErrors.email}
              helperText={formErrors.email}
              sx={textFieldStyles}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="phone"
              name="phone"
              label="Phone number"
              placeholder="017XXXXXXXX"
              autoComplete="tel"
              size="large"
              error={!!formErrors.phone}
              helperText={formErrors.phone}
              sx={textFieldStyles}
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
              error={!!formErrors.password}
              helperText={formErrors.password}
              sx={textFieldStyles}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm password"
              type="password"
              size="large"
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
              sx={textFieldStyles}
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
                "Create account"
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
          Already have an account?{" "}
          <Button
            onClick={() => navigate("/login")}
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
            Sign in
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
