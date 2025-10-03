import bcrypt from "bcryptjs"
import User from "../models/user.model";



export const signUp = async(req , res)=>{
    try{
        const {fullName , username , email , password} = req.body;
        const existingEmail = User.findOne({email});
        if(existingEmail){
            res.status(401).json({
                success:false , 
                message:"Email already exists"
            })
        }
        const existingUser = await User.findOne({username});

        if(existingUser){
            res.status(401).json({
                success:false , 
                message:"User with this username already exists"
            })
        }
        const hashPassword = bcrypt.hash(password , 10);
        const newUser  = await User.create({
            fullName, 
            username , 
            password:hashPassword,
            email
        })

        if(newUser){
            generateTokenAndSetCookie(user._id , res);
            await newUser.save();

            res.status(201).json({
                _id : newUser._id , 
                fullName: newUser.fullName ,
                username:newUser.username,
                email:newUser.email,
                followers:newUser.followers,
                following:newUser.followings,
                profileImage : newUser.profileImage , 
                coverImage:newUser.coverImage , 
            })
        }
        else{
            res.status(400).json({
                error:"Internal server error"
            })
        }
    }
    catch(error){
        res.status(501).json({
            success:false , 
            message:"Internal server error"
        })
    }
}
