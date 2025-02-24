import * as React from "react";
import { Grid, TextField, Button, Box, Snackbar, Alert, Paper, Typography, Divider } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getUser, login } from "../../../Redux/Auth/Action";
import { useEffect, useState } from "react";

export default function LoginUserForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const [openSnackBar, setOpenSnackBar] = useState(false);
  const { auth } = useSelector((store) => store);
  const handleCloseSnakbar = () => setOpenSnackBar(false);

  useEffect(() => {
    if (jwt) {
      dispatch(getUser(jwt));
    }
  }, [jwt]);

  useEffect(() => {
    if (auth.user) {
      setOpenSnackBar(true);
      const timer = setTimeout(() => {
        if (auth.user.role === "ADMIN") {
          navigate("/admin");
        } else {
          const from = location.state?.from || "/";
          navigate(from);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [auth.user, navigate, location.state]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const userData = {
      email: data.get("email"),
      password: data.get("password"),
    };
    dispatch(login(userData));
  };

  const textFieldStyles = {
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        borderColor: "#000000",
      },
      "&:hover fieldset": {
        borderColor: "#333333",
      },
      backgroundColor: { xs: "rgba(255, 255, 255, 0.8)", sm: "rgba(255, 255, 255, 0.9)" },
    },
    "& .MuiInputLabel-root": {
      fontSize: { xs: "0.875rem", sm: "1rem" },
      color: "#000000",
    },
    "& .MuiInputBase-input": {
      fontSize: { xs: "0.875rem", sm: "1rem" },
      padding: { xs: "8px 10px", sm: "10px 12px" },
    },
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '400px',
        mx: 'auto'
      }}
    >
      <Box sx={{ mb: { xs: 3, sm: 4, md: 5 } }}>
        <img 
          src="/images/logo.png" 
          alt="Tweest BD" 
          style={{ 
            height: '40px', 
            marginBottom: '24px' 
          }} 
        />
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            color: '#1a1a1a',
            mb: 1
          }}
        >
          Welcome Back
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#666666',
            mb: 3
          }}
        >
          Sign in to continue shopping
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <TextField
              required
              id="email"
              name="email"
              label="Email"
              fullWidth
              size="medium"
              autoComplete="email"
              variant="outlined"
              sx={textFieldStyles}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              id="password"
              name="password"
              label="Password"
              type="password"
              fullWidth
              size="medium"
              variant="outlined"
              sx={textFieldStyles}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{
                py: 1.5,
                backgroundColor: "#000000",
                color: "#ffffff",
                "&:hover": {
                  backgroundColor: "#333333",
                },
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 500,
                boxShadow: "none",
                borderRadius: "8px"
              }}
            >
              Sign In
            </Button>
          </Grid>
        </Grid>
      </form>

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Divider sx={{ 
          my: 3,
          "&::before, &::after": {
            borderColor: "rgba(0, 0, 0, 0.08)"
          }
        }}>
          <Typography 
            variant="body2" 
            sx={{
              color: "#666666",
              px: 2
            }}
          >
            New to Tweest BD?
          </Typography>
        </Divider>
        <Button
          onClick={() => navigate("/register")}
          variant="outlined"
          fullWidth
          size="large"
          sx={{
            py: 1.5,
            borderColor: "#000000",
            color: "#000000",
            "&:hover": {
              borderColor: "#333333",
              backgroundColor: "rgba(0, 0, 0, 0.04)"
            },
            textTransform: "none",
            fontSize: "1rem",
            fontWeight: 500,
            borderRadius: "8px"
          }}
        >
          Create Account
        </Button>
      </Box>

      <Snackbar 
        open={openSnackBar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnakbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnakbar}
          severity={auth.error ? "error" : "success"}
          sx={{ 
            width: "100%",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            backgroundColor: auth.error ? "#fff1f0" : "#f6ffed",
            color: auth.error ? "#ff4d4f" : "#52c41a",
          }}
        >
          {auth.error ? auth.error : auth.user ? "Login Successful" : ""}
        </Alert>
      </Snackbar>
    </Box>
  );
}
