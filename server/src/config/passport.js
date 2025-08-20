const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user.model.js');

console.log('Configuring Passport...');

// Passport configuration
passport.serializeUser((user, done) => {
    console.log('Serializing user:', user);
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        console.log('Deserializing user:', id);
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        console.error('Deserialize error:', error);
        done(error, null);
    }
});

console.log('Setting up Google Strategy...');
console.log('Client ID:', process.env.GOOGLE_CLIENT_ID);
console.log('Callback URL:', process.env.GOOGLE_CALLBACK_URL || 'https://tweestbd.com/auth/google/callback');

// Google OAuth Strategy
passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback', // Use relative URL to avoid domain mismatches
    proxy: true, // Important for handling proxied requests properly
    scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google auth callback received:', profile);
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
            console.log('Existing user found:', user);
            // Ensure user is OTP verified and has googleId
            if (!user.isOTPVerified || !user.googleId) {
                user.isOTPVerified = true;
                user.googleId = profile.id;
                await user.save();
                console.log('Updated existing user with Google ID and OTP verification');
            }
            return done(null, user);
        }

        console.log('Creating new user for:', profile.emails[0].value);
        user = await User.create({
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value,
            googleId: profile.id,
            role: 'CUSTOMER',
            isOTPVerified: true // Auto-verify Google users
        });

        console.log('New user created:', user);
        return done(null, user);
    } catch (error) {
        console.error('Google strategy error:', error);
        return done(error, null);
    }
}));

console.log('Passport configuration complete');

module.exports = passport; 