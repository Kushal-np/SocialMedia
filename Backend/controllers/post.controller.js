import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import multer from "multer";
import path from "path";
import cloudinary from "../server.js";


export const upload = multer({
  storage: multer.memoryStorage(), // store file in memory
  limits: { fileSize: 2 * 1024 * 1024 }, // max 2MB
});


// CREATE POST
export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!text && !req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Post must have text or image" });
    }

    let imgUrl = null;

    if (req.file) {
      // Upload image to Cloudinary
      imgUrl = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: "image", folder: "posts" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        uploadStream.end(req.file.buffer);
      });
    }

    const newPost = new Post({
      user: user._id,
      text,
      img: imgUrl,
    });

    await newPost.save();
    const populatedPost = await newPost.populate("user", "-password");

    res.status(201).json({ success: true, post: populatedPost });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



// DELETE POST

// DELETE /post/:id
export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;

    // 1️⃣ Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    // 2️⃣ Only allow owner to delete
    if (req.user._id.toString() !== post.user.toString()) {
      return res.status(403).json({ success: false, error: "Not authorized to delete this post" });
    }

    // 3️⃣ Delete the post
    await post.deleteOne();

    return res.status(200).json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};


// COMMENT ON POST
export const commentOnPost = async (req, res) => {
    try {
        const { text } = req.body;
        const postId = req.params.id;
        const userId = req.user._id;

        if (!text) return res.status(400).json({ success: false, message: "Text field is required" });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        const comment = { user: userId, text };
        post.comments.push(comment);
        await post.save();

        // Populate the comment users before sending
        const populatedPost = await post
            .populate("user")
           

        res.status(201).json({ success: true, post: populatedPost });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// LIKE / UNLIKE POST
export const likeUnlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userLikedPost = post.likes.includes(userId);

    if (userLikedPost) {
      // Unlike post
      post.likes.pull(userId);
      user.likedPosts.pull(postId);
      await post.save();
      await user.save();

      return res.status(200).json({ success: true, message: "Post unliked successfully" });
    } else {
      // Like post
      post.likes.push(userId);
      user.likedPosts.push(postId);
      await post.save();
      await user.save();

      // Create notification
      const notification = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });
      await notification.save();

      return res.status(200).json({ success: true, message: "Post liked successfully" });
    }
  } catch (error) {
    console.error("Error in likeUnlikePost:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


// GET ALL POSTS
export const getAllPost = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", "_id fullName username profileImage") // ate post authorpopul
      .populate("comments.user", "_id fullName username profileImage") // populate comment authors
      .populate("likes", "_id fullName username profileImage"); // populate users who liked

    if (!posts.length) {
      return res.status(200).json({ success: false, posts: [] });
    }

    res.status(200).json({
      success: true,
      posts, // send populated posts
    });
  } catch (error) {
    console.error("Error in getAllPosts Controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const getLikedPosts = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Fetch all liked posts by this user
    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate("user", "fullName username profileImage") // show who posted it
      .populate("comments.user", "fullName username profileImage");

    res.status(200).json({
      success: true,
      likedPosts,
    });
  } catch (error) {
    console.error("Error in getLikedPosts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const getFollowingPosts = async (req, res) => {
  try {
    // ✅ Ensure middleware attached
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const following = user.followings || [];

    const feedPosts = await Post.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });

    res.status(200).json(feedPosts);
  } catch (error) {
    console.log("Error in getFollowingPosts controller:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};


export const getUserPosts = async(req , res)=>{
    try{
        const {username} = req.params;
        const user = await User.findOne({username});
        if(!user){
            return res.status(404).json({
                success:false , 
                message:"user not found"
            })
        }
        const post = await Post.find({user:user._id})
        .sort({createdAt:-1})
        .populate({
            path:"user" ,
            select:"password"
        })
        .populate({
            path:"comments.user" , 
            select:"-password"
        });

        res.status(200).json(post)
    }
    catch(error){
        res.status(500).json({
            success:false , 
            message:"Internal server error",
            error:error.message
        })
    }   
}