import express from "express"
import { getMe, login, logout, signUp } from "../controllers/auth.controller.js";
import { protectedRoute } from "../Middleware/protectedRoute.js";
const router = express.Router();

router.post("/signup" ,signUp)
router.post("/login" , login)
router.post("/logout" , logout)
router.get("/me" ,protectedRoute, getMe);
export default router ; 