const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user.model.js');
const jwtProvider=require("../config/jwtProvider")

const createUser = async (userData)=>{
    try {
        let {firstName,lastName,email,password,role}=userData;

        const isUserExist=await User.findOne({email});

        if(isUserExist){
            throw new Error("user already exists with email: " + email);
        }

        password=await bcrypt.hash(password,8);
    
        const user=await User.create({firstName,lastName,email,password,role})

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

const getAllUsers=async()=>{
    try {
        const users=await User.find();
        return users;
    } catch (error) {
        console.log("Error getting all users:", error.message);
        throw error;
    }
}

module.exports={
    createUser,
    findUserById,
    getUserProfileByToken,
    getUserByEmail,
    getAllUsers
}