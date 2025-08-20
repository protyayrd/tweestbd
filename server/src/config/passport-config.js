const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user.model');
require('dotenv').config();

const initializePassport = () => {
    console.log('Configuring Passport...');

    // Configure passport session handling
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

    // Configure Google Strategy
    console.log('Setting up Google Strategy...');
    console.log('Client ID:', process.env.GOOGLE_CLIENT_ID);
    console.log('Callback URL:', process.env.GOOGLE_CALLBACK_URL);

    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            let user = await User.findOne({ email: profile.emails[0].value });

            if (!user) {
                // Create new user if doesn't exist
                user = await User.create({
                    googleId: profile.id,
                    email: profile.emails[0].value,
                    firstName: profile.name.givenName,
                    lastName: profile.name.familyName,
                    role: 'CUSTOMER'
                });
            } else if (!user.googleId) {
                // Update existing user with Google ID if not present
                user.googleId = profile.id;
                await user.save();
            }

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));

    console.log('Passport configuration complete');
    console.log('Passport strategies:', passport._strategies);

    return passport;
};

module.exports = initializePassport; 