import express from "express"
import { protectedRoute } from "../Middleware/protectedRoute.js";
import { commentOnPost, createPost, deletePost, getAllPost, getFollowingPosts, getLikedPosts, getUserPosts, likeUnlikePost } from "../controllers/post.controller.js";
const router = express.Router();


router.post("/create" , protectedRoute  , createPost);
router.get("/following" , protectedRoute , getFollowingPosts);
router.get("/likes/:id" , protectedRoute , getLikedPosts)
router.post("/like/:id" , protectedRoute , likeUnlikePost);
router.post("/comment/:id" , protectedRoute , commentOnPost) ; 
router.delete("/:id" , protectedRoute , deletePost)
router.get("/AllPosts" , getAllPost);
router.get("/user/:username" , protectedRoute , getUserPosts)



export default router ; 