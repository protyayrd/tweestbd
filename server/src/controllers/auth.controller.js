const userService=require("../services/user.service.js")
const jwtProvider=require("../config/jwtProvider.js")
const bcrypt=require("bcryptjs")
const cartService=require("../services/cart.service.js")
const User = require("../models/user.model.js")
const { generateOTP, storeOTP, verifyOTP, isValidBangladeshiPhone } = require("../utils/otpUtils.js")

const register=async(req,res)=>{
    try {
        console.log("Registration request body:", JSON.stringify(req.body, null, 2));
        
        // Check if required fields are present
        const { firstName, lastName, email, password, phone } = req.body;
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        
        // Validate phone format if provided
        if (phone) {
            const phoneRegex = /^01[3-9]\d{8}$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({ message: 'Invalid Bangladesh phone number format' });
            }
        }
        
        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        
        const user = await userService.createUser(req.body);
        console.log("Created user:", JSON.stringify(user, null, 2));
        const jwt = jwtProvider.generateToken(user._id);

        await cartService.createCart(user._id);

        return res.status(200).json({
            jwt, 
            message: "Registration successful",
            success: true
        });

    } catch (error) {
        console.error("Registration error:", error);
        
        // Check for specific error types
        if (error.message.includes("already exists")) {
            return res.status(409).json({ message: error.message });
        }
        
        return res.status(500).json({ message: error.message || 'Registration failed' });
    }
}

const login=async(req,res)=>{
    const {password, email, phone} = req.body;
    try {
        // Check for required credentials
        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }
        
        if (!email && !phone) {
            return res.status(400).json({ message: 'Email or phone number is required' });
        }
        
        let user;
        
        if (email) {
            console.log("Login attempt with email:", email);
            try {
                user = await userService.getUserByEmail(email);
            } catch (error) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
        } else if (phone) {
            console.log("Login attempt with phone:", phone);
            try {
                user = await userService.getUserByPhone(phone);
            } catch (error) {
                return res.status(401).json({ message: 'Invalid phone number or password' });
            }
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const jwt = jwtProvider.generateToken(user._id);
        console.log("Login successful for user:", user._id);

        return res.status(200).json({
            jwt, 
            message: "Login successful",
            success: true
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: error.message || 'Login failed' });
    }
}

const googleAuthCallback = async (req, res) => {
    try {
        console.log('Google auth callback triggered');
        
        if (!req.user) {
            console.error('No user data in request');
            return res.send(`
                <html>
                <head>
                    <title>Authentication Error</title>
                </head>
                <body>
                    <script>
                        window.opener ? window.opener.postMessage({error: 'auth_failed'}, '*') : window.location.href = '/login';
                        window.close();
                    </script>
                </body>
                </html>
            `);
        }

        console.log('User authenticated via Google:', req.user.email);
        
        const jwt = jwtProvider.generateToken(req.user._id);
        console.log('Generated JWT for user:', req.user._id);
        
        // Create cart for new Google users if needed
        if (!req.user.cart) {
            try {
                await cartService.createCart(req.user._id);
                console.log('Created new cart for user:', req.user._id);
            } catch (error) {
                console.error('Error creating cart:', error);
                // Continue even if cart creation fails
            }
        }

        // Instead of redirecting, send an HTML page with JavaScript that will
        // store the token, handle any pending cart items, and redirect the client
        return res.send(`
            <html>
            <head>
                <title>Authentication Successful</title>
                <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
            </head>
            <body>
                <script>
                    // Store the token in localStorage
                    localStorage.setItem('jwt', '${jwt}');
                    console.log('Token stored in localStorage');
                    
                    // Check for pending cart item in sessionStorage
                    const pendingCartItem = sessionStorage.getItem('pendingCartItem');
                    
                    // Function to add pending cart item
                    const addPendingCartItem = async (cartItem) => {
                        try {
                            const parsedItem = JSON.parse(cartItem);
                            console.log('Adding pending item to cart:', parsedItem);
                            
                            const response = await fetch('${process.env.API_BASE_URL || 'http://localhost:5454'}/api/cart/add', {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ${jwt}'
                                },
                                body: JSON.stringify(parsedItem)
                            });
                            
                            if (!response.ok) {
                                throw new Error('Failed to add item to cart');
                            }
                            
                            console.log('Pending cart item added successfully');
                            // Remove the pending item from sessionStorage
                            sessionStorage.removeItem('pendingCartItem');
                        } catch (error) {
                            console.error('Error adding pending cart item:', error);
                            // Keep the pending item in sessionStorage to try again later
                        }
                    };
                    
                    // If there's a pending cart item, add it to the cart
                    if (pendingCartItem) {
                        console.log('Found pending cart item, adding to cart...');
                        addPendingCartItem(pendingCartItem);
                    }
                    
                    // Try to notify the opener window if this was opened as a popup
                    if (window.opener) {
                        try {
                            window.opener.postMessage({ 
                                type: 'GOOGLE_AUTH_SUCCESS',
                                token: '${jwt}',
                                hasPendingCartItem: !!pendingCartItem 
                            }, '*');
                            console.log('Auth success message sent to opener window');
                        } catch(err) {
                            console.error('Error communicating with opener:', err);
                        }
                        // Close popup after a short delay to ensure messages are sent
                        setTimeout(() => window.close(), 1000);
                    } else {
                        // Redirect to the cart page after a short delay to ensure cart is updated
                        setTimeout(() => window.location.href = '/cart', 1000);
                    }
                </script>
                <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
                    <h2>Authentication Successful</h2>
                    <p>You are being redirected...</p>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error("Google auth callback error:", error);
        return res.send(`
            <html>
            <head>
                <title>Authentication Error</title>
            </head>
            <body>
                <script>
                    window.opener ? window.opener.postMessage({error: '${error.message || 'auth_failed'}'}, '*') : window.location.href = '/login?error=${encodeURIComponent(error.message || 'auth_failed')}';
                    window.close();
                </script>
                <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
                    <h2>Authentication Error</h2>
                    <p>There was a problem signing you in. You will be redirected shortly.</p>
                </div>
            </body>
            </html>
        `);
    }
};

const sendOTP = async (req, res) => {
    try {
        const { phone } = req.body;
        const userId = req.user._id;

        if (!isValidBangladeshiPhone(phone)) {
            return res.status(400).json({ message: 'Invalid Bangladesh phone number' });
        }

        // Check if phone is already verified for another user
        const existingUser = await User.findOne({ phone, isOTPVerified: true, _id: { $ne: userId } });
        if (existingUser) {
            return res.status(400).json({ message: 'Phone number already verified for another account' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check cooldown period (1 minute)
        if (user.lastOTPSentAt && Date.now() - user.lastOTPSentAt.getTime() < 60000) {
            return res.status(429).json({ message: 'Please wait 1 minute before requesting another OTP' });
        }

        const otp = generateOTP();
        storeOTP(phone, otp);

        // Update user's lastOTPSentAt
        user.lastOTPSentAt = new Date();
        await user.save();

        // In production, send OTP via SMS service
        // For development, return OTP in response
        res.json({ message: 'OTP sent successfully', otp });
    } catch (error) {
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

const verifyPhoneOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const result = verifyOTP(phone, otp);
        if (!result.isValid) {
            return res.status(400).json({ message: result.message });
        }

        // Update user's phone and verification status
        user.phone = phone;
        user.isOTPVerified = true;
        user.otpAttempts = 0;
        await user.save();

        res.json({ message: 'Phone number verified successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying OTP', error: error.message });
    }
};

const updatePhone = async (req, res) => {
    try {
        const { phone } = req.body;
        const userId = req.user._id;

        if (!isValidBangladeshiPhone(phone)) {
            return res.status(400).json({ message: 'Invalid Bangladesh phone number' });
        }

        const existingUser = await User.findOne({ phone, isOTPVerified: true, _id: { $ne: userId } });
        if (existingUser) {
            return res.status(400).json({ message: 'Phone number already verified for another account' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update phone and automatically mark as verified
        user.phone = phone;
        user.isOTPVerified = true;
        user.otpAttempts = 0;
        await user.save();

        // Create cart for the user
        try {
            console.log("Creating cart for user after phone verification");
            await cartService.createCart(userId);
        } catch (cartError) {
            console.error("Error creating cart during phone verification:", cartError);
            // Continue with the response even if cart creation fails
        }

        // Return updated user
        res.json({ 
            message: 'Phone number updated successfully',
            success: true,
            isOTPVerified: true
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating phone number', error: error.message });
    }
};

module.exports={register, login, googleAuthCallback, updatePhone, sendOTP, verifyPhoneOTP}