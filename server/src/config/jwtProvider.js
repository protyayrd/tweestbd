require('dotenv').config();
const jwt = require('jsonwebtoken');
const SECRET_KEY=process.env.SECRET_KEY

const generateToken=(userId)=>{
    console.log("Generating token for userId:", userId);
    const token=jwt.sign({_id: userId},SECRET_KEY,{ expiresIn: '48h' })
    console.log("Generated token:", token);
    return token;
}

const getUserIdFromToken=(token)=>{
    try {
        console.log("Decoding token:", token);
        const decodedToken=jwt.verify(token,SECRET_KEY)
        console.log("Decoded token:", decodedToken);
        return decodedToken._id;
    } catch (error) {
        console.error("Error decoding token:", error);
        throw error;
    }
}

module.exports={generateToken,getUserIdFromToken};