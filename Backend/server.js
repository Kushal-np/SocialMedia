import express from "express"
const app = express();
import { connectDB } from "./config/db.js";
import dotenv from "dotenv"
dotenv.config();
import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/user.routes.js"
import postRoutes from "./routes/post.route.js"
import notificationRoutes from "./routes/notification.route.js"
import cookieParser from "cookie-parser";
import {v2 as cloudinary} from "cloudinary";
cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME , 
    api_key : process.env.CLOUDINARY_API_KEY , 
    api_secret : process.env.CLOUDINARY_API_SECRET,
});
const PORT = process.env.PORT  ;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser())
app.use("/auth" , authRoutes) ; 
app.use("/user" , userRoutes) ;
app.use("/post" , postRoutes) ;
app.use("/notifications" , notificationRoutes)
import mongoose from "mongoose";


app.listen(PORT , ()=>{
    console.log(`Server running on port ${PORT}`)
    connectDB();
})
