import mongoose from "mongoose" 

export const connectDB = async() =>{
    try{
        const connect = await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MONGODB");
    }   
    catch(error){
        res.status(501).json({
            success:false , 
            message:"Internal error" , 
            error
        })
    }
}