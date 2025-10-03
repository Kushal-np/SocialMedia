import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

export const signUp = async (req, res) => {
    try {
        const { fullName, username, email, password } = req.body;

        // Check for existing email
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(401).json({
                success: false,
                message: "Email already exists",
            });
        }

        // Check for existing username
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(401).json({
                success: false,
                message: "User with this username already exists",
            });
        }
        if(password.length < 6){
            return res.status(401).json({
                success:false , 
                message:"Password must be greater than 6 characters long"
            })
        }
        // Hash the password
        const hashPassword = await bcrypt.hash(password, 10); // Add await here for bcrypt.hash
        const newUser = await User({
            fullName,
            username,
            password: hashPassword,
            email,
        });

        if (newUser) {
            generateTokenAndSetCookie(newUser._id, res);
            await newUser.save(); // Note: This is redundant since User.create already saves the user

            return res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                followers: newUser.followers,
                following: newUser.followings, // Note: 'followings' might be a typo; should it be 'following'?
                profileImage: newUser.profileImage,
                coverImage: newUser.coverImage,
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Failed to create user",
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};