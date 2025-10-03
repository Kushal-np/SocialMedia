import express from "express"
const app = express();
import { connectDB } from "./config/db.js";
import dotenv from "dotenv"
dotenv.config();
import authRoutes from "./routes/auth.routes.js"
import cookieParser from "cookie-parser";
const PORT = process.env.PORT  ;
app.use(express.json());
app.use(cookieParser())
app.use("/auth" , authRoutes) ; 
app.listen(PORT , ()=>{
    console.log(`Server running on port ${PORT}`)
    connectDB();
})
