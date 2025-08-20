const express = require("express");
const passport = require("../config/passport");
const router = express.Router();
const authController = require("../controllers/auth.controller.js");
const { protect } = require("../middleware/auth.js");

console.log('Setting up auth routes...');
console.log('Passport strategies:', passport._strategies);

// Public routes
router.post("/signin", authController.login);
router.post("/signup", authController.register);

// Protected routes (require authentication)
router.post("/send-otp", protect, authController.sendOTP);
router.post("/verify-otp", protect, authController.verifyPhoneOTP);
router.put("/update-phone", protect, authController.updatePhone);

// Google OAuth routes
router.get("/google", (req, res, next) => {
    // Store original referrer to track where the auth request came from
    req.session.authOrigin = req.get('Referrer') || req.headers.referer || '/';
    console.log('Starting Google OAuth from:', req.session.authOrigin);
    
    // Use passport for authentication
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        accessType: 'offline',
        prompt: 'select_account' // Use select_account to force account selection and prevent auto-login loops
    })(req, res, next);
});

router.get("/google/callback", 
    (req, res, next) => {
        console.log('Google callback received, authenticating...');
        passport.authenticate('google', { 
            failureRedirect: "/login?error=google_auth_failed",
            session: true,
            failWithError: true
        })(req, res, next);
    },
    (req, res, next) => {
        // Log success and pass to controller
        console.log('Google authentication successful, processing user...');
        next();
    },
    authController.googleAuthCallback
);

console.log('Auth routes setup complete');

module.exports = router;