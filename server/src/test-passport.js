require('dotenv').config();
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

// Initialize passport
app.use(passport.initialize());

console.log('Before strategy setup');
console.log('Available strategies:', Object.keys(passport._strategies));

// Set up Google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    done(null, profile);
}));

console.log('After strategy setup');
console.log('Available strategies:', Object.keys(passport._strategies));

// Test route
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.listen(5455, () => {
    console.log('Test server running on port 5455');
}); 