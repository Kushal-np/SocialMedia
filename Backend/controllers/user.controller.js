import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export const getUserProfile = async(req , res)=>{
    try{
        const {username} = req.params ; 
        const user = await User.findOne({username}).select("-password");
        if(!user){
            return res.status(404).json({
                success:false , 
                message: "User not found"
            })
        }
        res.status(201).json(user)
    }
    catch(error){
        console.log("Error in getUserProfile" , error.message);
        res.status(500).json({
            success:false , 
            error:error.message 
        })
    }
}


export const getSuggestedUsers = async(req, res)=>{
    try{
        const userId = req.user._id;
        const userFollowedByMe = await User.findById(userId).select("following");
        const users = await User.aggregate([
            {
                $match:{
                    _id:{$ne : userId}
                }
            },
            {
                $sample:{size:10}
            }
        ])

        const filteredUseres = users.filter(user=> !userFollowedByMe.followings.includes(user.id));
        const suggestedUsers = filteredUseres.slice(0,4);
        suggestedUsers.forEach((user)=>(user.password = null));

        res.status(200).json({
            suggestedUsers
        })
    }
    catch(error){
        res.status(500).json({
            success:false,
            message:"Internal server error" , 
            error:error.message
        })
    }   
}

export const followUnfollowUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userToModify = await User.findById(id);
        const currentUser = await User.findById(req.user._id);

        if (id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You can't follow or unfollow yourself",
            });
        }

        if (!userToModify || !currentUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const isFollowing = currentUser.followings.includes(id);

        if (isFollowing) {
            await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $pull: { followings: id } });
            return res.status(200).json({
                success: true,
                message: "User unfollowed successfully",
            });
        } else {

            await User.findByIdAndUpdate(id, { $addToSet: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $addToSet: { followings: id } });
             res.status(200).json({
                success: true,
                message: "User followed successfully",
            });
            const newNotification = new Notification({
                type:"follow" , 
                from:req.user._id , 
                to:id , 

            })
            await newNotification.save();

            res.status(200).json({
                success:true , 
                message:"User followed successfully"
            })
        }
    } catch (error) {
        console.log("Error in followUnfollowUser:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};



export const updateUser = async(req , res)=>{
    try{
        const {fullName , email , username , currentPassword , newPassword , bio , link} = req.body;
        let {profileImage , coverImage} = req.body;

        const userId = req.user._id;
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({
                success:false , 
                message:"User not found"
            })
        }
        if(!currentPassword || !newPassword){
            return res.status(400).json({
                error:"Plesae provide both current and new Password"
            })
        }
        if(currentPassword && newPassword){
            const isMatch = await bcrypt.compare(currentPassword , user.password);
            if(!isMatch){
                return res.status(400).json({
                    success:false , 
                    message:"Current password is incorrect"
                })
            }
            if(newPassword.length<6){
                return res.status(400).json({
                    success:false , 
                    message:"Password must be at least 6 characters long"
                })
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword , salt );
        }

        if(profileImage){
            const uploadResponse = await cloudinary.uploader.upload(profileImage)
            profileImage = uploadResponse.secure_url ; 
        }
        if(coverImage){ 
            const uploadResponse = await cloudinary.uploader.upload(coverImage);
            coverImage = uploadResponse.secure_url;
        }


        user.fullName = fullName || user.fullName ; 
        user.email = email || user.email ; 
        user.username = username || user.username ; 
        user.bio = bio || user.bio ; 
        user.link = link || user.link;
        user.profileImage = profileImage || user.profileImage ; 
        user.coverImage = coverImage || user.coverImage ; 


        user = await user.save();


        user.password = null ; 
        return res.status(201).json({
            success:true , 
            message: "Updated successfully " , 
            user 
        })
    }
    catch(error){

    }
}