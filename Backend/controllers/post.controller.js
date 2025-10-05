import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";

// CREATE POST
export const createPost = async (req, res) => {
    try {
        let { text, img } = req.body;
        const userId = req.user._id; // use _id, not id.toString()

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!text && !img) {
            return res.status(400).json({ success: false, message: "Post must have text or image" });
        }

        if (img) {
            const uploadResponse = await cloudinary.uploader.upload(img);
            img = uploadResponse.secure_url;
        }

        const newPost = new Post({
            user: req.user._id, 
            text,
            img
        });

        await newPost.save();

        // Populate the user field before sending response
        const populatedPost = await newPost.populate("user");

        res.status(201).json({ success: true, post: populatedPost });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE POST
export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: "Not authorized to delete this post" });
        }

        if (post.img) {
            try {
                const parts = post.img.split("/");
                const uploadIndex = parts.findIndex(p => p === "upload");
                const publicId = parts.slice(uploadIndex + 1).join("/").split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            } catch (err) {
                console.error("Cloudinary deletion error:", err.message);
            }
        }

        await post.remove();

        res.status(200).json({ success: true, message: "Post deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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


export const getFollowingPosts = async(req , res)=>{
    try{
        const userId = req.user._id;
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({
                success:false , 
                message:"User not found"
            })
        }
        const following = user.followings ; 
        const feedPosts = await Post.find({user : {$in : following}})
        .sort({createdAt:-1})
        .populate({
            path:"user" , 
            select:"-password" , 
        })
        .populate({
            path:"comments.user" , 
            select:"-password",
        });
        res.status(200).json(feedPosts)
    }
    catch(error){
        console.log("Error in getFollowingPosts controller" , error)
        res.status(500).json({
            error:"internal server error"
        })
    }
}



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