const userService=require("../services/user.service")
const bcrypt = require("bcryptjs")
const User = require("../models/user.model")
const jwtProvider = require("../config/jwtProvider.js")

const getUserProfile=async (req,res)=>{
    try {
        const jwt= req.headers.authorization?.split(' ')[1];

        if(!jwt){
            return res.status(404).send({error:"token not found"})
        }
        const user=await userService.getUserProfileByToken(jwt)

        return res.status(200).send(user)

    
    } catch (error) {
        console.log("error from controller - ",error)
        return res.status(500).send({error:error.message})
    }
}

const getAllUsers=async(req,res)=>{
    try {
        const users=await userService.getAllUsers()
        return res.status(200).send(users)
    } catch (error) {
        return res.status(500).send({error:error.message})
    }
}

const getAllCustomers=async(req,res)=>{
    try {
        const customers=await userService.getAllCustomers()
        return res.status(200).send(customers)
    } catch (error) {
        return res.status(500).send({error:error.message})
    }
}

const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const updateData = req.body;
        
        // Remove fields that shouldn't be updated directly
        delete updateData.password;
        delete updateData.role;
        
        const updatedUser = await userService.updateUserProfile(userId, updateData);
        return res.status(200).send(updatedUser);
    } catch (error) {
        console.log("Error updating user profile:", error);
        return res.status(500).send({error: error.message});
    }
}

const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await userService.findUserById(userId);
        
        // Remove sensitive information
        user.password = undefined;
        
        return res.status(200).send(user);
    } catch (error) {
        return res.status(500).send({error: error.message});
    }
}

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        await userService.deleteUser(userId);
        return res.status(200).send({message: "User deleted successfully"});
    } catch (error) {
        return res.status(500).send({error: error.message});
    }
}

const createCustomer = async (req, res) => {
    try {
        // Ensure role is set to CUSTOMER
        const userData = { ...req.body, role: "CUSTOMER" };
        
        // Create the customer
        const customer = await userService.createUser(userData);
        
        // Remove sensitive info before sending response
        customer.password = undefined;
        
        return res.status(201).send(customer);
    } catch (error) {
        console.log("Error creating customer:", error);
        return res.status(500).send({error: error.message});
    }
}

// User password change - requires current password verification
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send({error: "User not found"});
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).send({error: "Current password is incorrect"});
        }

        // Update password through service
        await userService.updatePassword(userId, newPassword);
        
        return res.status(200).send({message: "Password changed successfully"});
    } catch (error) {
        console.log("Error changing password:", error);
        return res.status(500).send({error: error.message});
    }
}

// Admin password reset - doesn't require current password
const adminResetUserPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const userId = req.params.id;

        // Update password through service
        await userService.updatePassword(userId, newPassword);
        
        return res.status(200).send({message: "Password reset successfully"});
    } catch (error) {
        console.log("Error resetting password:", error);
        return res.status(500).send({error: error.message});
    }
}

const validateToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(200).json({ valid: false, message: "No token provided" });
        }

        // Verify the token's validity
        const isValid = await jwtProvider.validateToken(token);
        
        if (isValid) {
            return res.status(200).json({ valid: true });
        } else {
            return res.status(200).json({ valid: false, message: "Invalid token" });
        }
    } catch (error) {
        console.error("Token validation error:", error);
        return res.status(200).json({ valid: false, message: error.message });
    }
};

const verifyAdminAccess = async (req, res) => {
    try {
        // The authenticate middleware should have already set req.user
        // The isAdmin middleware should have already verified admin role
        // If we reach this point, the user is authenticated and is an admin
        
        return res.status(200).json({ 
            success: true, 
            isAdmin: true,
            user: {
                _id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email,
                role: req.user.role
            },
            message: "Admin access verified" 
        });
    } catch (error) {
        console.error("Admin verification error:", error);
        return res.status(500).json({ 
            success: false, 
            isAdmin: false, 
            message: "Server error during admin verification" 
        });
    }
};

module.exports={
    getUserProfile,
    getAllUsers,
    getAllCustomers,
    updateUserProfile,
    getUserById,
    deleteUser,
    createCustomer,
    changePassword,
    adminResetUserPassword,
    validateToken,
    verifyAdminAccess
}