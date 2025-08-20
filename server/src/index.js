require('dotenv').config();
const express = require("express");
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const initializePassport = require('./config/passport-config');

const app = express();

// CORS configuration
app.use(cors({
  origin: ['https://tweestbd.com', 'https://www.tweestbd.com', 'http://tweestbd.com', 'http://www.tweestbd.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SECRET_KEY || 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// Initialize passport
const passport = initializePassport();
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/tweestbd', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});

app.get("/", (req, res) => {
    return res.status(200).send({message: "welcome to ecommerce api - node"});
});

// Other route registrations
const authRouter = require("./routes/auth.routes.js");
app.use("/auth", authRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || "Something went wrong!",
        error: err.message
    });
});

const PORT = process.env.PORT || 5454;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = { app };