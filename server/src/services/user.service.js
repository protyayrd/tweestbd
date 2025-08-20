const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model.js');
const jwtProvider=require("../config/jwtProvider")

const createUser = async (userData)=>{
    try {
        let {firstName, lastName, email, password, role, phone} = userData;

        const isUserExist = await User.findOne({email});

        if(isUserExist){
            throw new Error("user already exists with email: " + email);
        }
    
        const user = await User.create({firstName, lastName, email, password, role, phone})

        console.log("Created user:", user);
    
        return user;
        
    } catch (error) {
        console.log("Error creating user:", error.message);
        throw error;
    }
}

const findUserById=async(userId)=>{
    try {
        console.log("Finding user with ID:", userId);
        const user = await User.findById(userId);
        console.log("Found user:", user);
        if(!user){
            throw new Error("user not found with id: " + userId);
        }
        return user;
    } catch (error) {
        console.log("Error finding user:", error.message);
        throw error;
    }
}

const getUserByEmail=async(email)=>{
    try {
        const user=await User.findOne({email});

        if(!user){
            throw new Error("user not found with email: " + email);
        }

        return user;
        
    } catch (error) {
        console.log("Error getting user by email:", error.message);
        throw error;
    }
}

const getUserProfileByToken=async(token)=>{
    try {
        const userId=jwtProvider.getUserIdFromToken(token);
        console.log("User ID from token:", userId);

        const user= await findUserById(userId);
        const populatedUser = await user.populate("addresses");
        populatedUser.password=null;
        
        if(!populatedUser){
            throw new Error("user not found with id: " + userId);
        }
        return populatedUser;
    } catch (error) {
        console.log("Error getting user profile:", error.message);
        throw error;
    }
}

const getUserByPhone = async (phone) => {
    try {
        const user = await User.findOne({ phone });
        
        if (!user) {
            throw new Error("user not found with phone: " + phone);
        }
        
        return user;
    } catch (error) {
        console.log("Error getting user by phone:", error.message);
        throw error;
    }
}

const getAllUsers=async()=>{
    try {
        const users=await User.find();
        return users;
    } catch (error) {
        console.log("Error getting all users:", error.message);
        throw error;
    }
}

const getAllCustomers=async()=>{
    try {
        const customers=await User.find({ role: "CUSTOMER" });
        return customers;
    } catch (error) {
        console.log("Error getting all customers:", error.message);
        throw error;
    }
}

const updateUserProfile = async (userId, updateData) => {
    try {
        // Find user by ID and update
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true } // Return the updated document
        );
        
        if (!updatedUser) {
            throw new Error("User not found with id: " + userId);
        }
        
        // Don't return the password
        updatedUser.password = undefined;
        
        return updatedUser;
    } catch (error) {
        console.log("Error updating user profile:", error.message);
        throw error;
    }
}

const deleteUser = async (userId) => {
    try {
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found with id: " + userId);
        }
        
        // Delete the user
        await User.findByIdAndDelete(userId);
        
        return { success: true };
    } catch (error) {
        console.log("Error deleting user:", error.message);
        throw error;
    }
}

const updatePassword = async (userId, newPassword) => {
    try {
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found with id: " + userId);
        }
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update the password
        user.password = hashedPassword;
        await user.save();
        
        return { success: true };
    } catch (error) {
        console.log("Error updating password:", error.message);
        throw error;
    }
}

module.exports={
    createUser,
    findUserById,
    getUserProfileByToken,
    getUserByEmail,
    getUserByPhone,
    getAllUsers,
    getAllCustomers,
    updateUserProfile,
    deleteUser,
    updatePassword
}