const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user.model.js');

const setupPassport = () => {
    passport.use('google', new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback'
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                console.log('Google auth callback received:', profile);
                // Check if user already exists
                let user = await User.findOne({ email: profile.emails[0].value });

                if (user) {
                    // Ensure user is OTP verified
                    if (!user.isOTPVerified) {
                        user.isOTPVerified = true;
                        await user.save();
                        console.log('Updated existing user isOTPVerified to true');
                    }
                    return done(null, user);
                }

                // If user doesn't exist, create a new user
                user = await User.create({
                    firstName: profile.name.givenName,
                    lastName: profile.name.familyName,
                    email: profile.emails[0].value,
                    password: profile.id, // Using Google ID as password for these users
                    role: 'CUSTOMER', // Default role for Google sign-in users
                    isOTPVerified: true // Auto-verify Google users
                });

                return done(null, user);
            } catch (error) {
                console.error('Google strategy error:', error);
                return done(error, null);
            }
        }
    ));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};

module.exports = setupPassport; 