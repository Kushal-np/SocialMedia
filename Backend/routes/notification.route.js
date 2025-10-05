import express from "express"
import { protectedRoute } from "../Middleware/protectedRoute.js"
import { deleteNotifications, getNotifications } from "../controllers/notification.controller.js";


const router = express.Router();

router.get("/" , protectedRoute , getNotifications);
router.get("/:id" , protectedRoute , deleteNotifications)
export default router;