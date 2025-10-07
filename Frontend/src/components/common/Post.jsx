import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";

const Post = ({ post }) => {
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();

  // ✅ Get currently logged-in user from cache
  const authUser = queryClient.getQueryData(["authUser"]);

  // Safe access to post owner
  const postOwner = post.user || {
    username: "unknown",
    fullName: "Unknown User",
    profileImg: "/avatar-placeholder.png",
    _id: null,
  };

  // ✅ Determine if this post belongs to the logged-in user
  const isMyPost = authUser && post.user && authUser._id === post.user._id;

  // ✅ Check if the logged-in user liked this post
  const isLiked =
    post.likes && authUser && post.likes.some((like) => like._id === authUser._id);

  const formattedDate = new Date(post.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isCommenting = true;

  // ✅ Delete post mutation
  const { mutate: deletePost, isLoading: isDeleting } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`http://localhost:7000/post/${post._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data;
    },
    onSuccess: () => {
      toast.success("Post deleted Successfully");
      queryClient.invalidateQueries(["posts"]); // refresh posts
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const {mutate:likePost , isPending:isLiking} = useMutation({
    mutationFn:async() =>{
      try{
        const res = await fetch(`http://localhost:7000/post/like/${post._id}`,{
          method:"POST" , 
          credentials:"include"

        });
        const data= await await res.json();
        if(!res.ok){
          throw new Error(data.error || "Something went wrong");
        } 
        return data ; 
      }
      catch(error){
        throw new Error(error);
      }
    },
    onSuccess:() =>{
      toast.success("Post liked successfully");
      queryClient.invalidateQueries({queryKey:["posts"]});
    },
    onError:(error) =>{
      toast.error(error.message);
    }
  })

  const handleDeletePost = () => {
    deletePost();
  };

  const handlePostComment = (e) => {
    e.preventDefault();
  };

  const handleLikePost = () => {
    if(isLiking){
      return ; 
    }
    likePost();
  };

  return (
    <div className="flex gap-2 items-start p-4 border-b border-gray-700">
      {/* Avatar */}
      <div className="avatar">
        <Link to={`/profile/${postOwner.username}`} className="w-8 rounded-full overflow-hidden">
          <img src={postOwner.profileImg} alt={`${postOwner.fullName}'s profile`} />
        </Link>
      </div>

      {/* Post content */}
      <div className="flex flex-col flex-1">
        <div className="flex gap-2 items-center">
          <Link to={`/profile/${postOwner.username}`} className="font-bold">
            {postOwner.fullName}
          </Link>
          <span className="text-gray-700 flex gap-1 text-sm">
            <Link to={`/profile/${postOwner.username}`}>@{postOwner.username}</Link>
            <span>·</span>
            <span>{formattedDate}</span>
          </span>

          {/* Delete button if it's user's post */}
          {isMyPost && (
            <span className="flex justify-end flex-1">
              {!isDeleting ? (
                <FaTrash className="cursor-pointer hover:text-red-500" onClick={handleDeletePost} />
              ) : (
                <LoadingSpinner size="sm" />
              )}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 overflow-hidden">
          <span>{post.text}</span>
          {post.img && (
            <img
              src={post.img}
              className="h-80 object-contain rounded-lg border border-gray-700"
              alt="Post content"
            />
          )}
        </div>

        {/* Post actions */}
        <div className="flex justify-between mt-3">
          <div className="flex gap-4 items-center w-2/3 justify-between">
            {/* Comments */}
            <div
              className="flex gap-1 items-center cursor-pointer group"
              onClick={() => document.getElementById(`comments_modal_${post._id}`).showModal()}
            >
              <FaRegComment className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
              <span className="text-sm text-slate-500 group-hover:text-sky-400">
                {post.comments.length}
              </span>
            </div>

            {/* Comments modal */}
            <dialog id={`comments_modal_${post._id}`} className="modal border-none outline-none">
              <div className="modal-box rounded border border-gray-600">
                <h3 className="font-bold text-lg mb-4">COMMENTS</h3>
                <div className="flex flex-col gap-3 max-h-60 overflow-auto">
                  {post.comments.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No comments yet 🤔 Be the first one 😉
                    </p>
                  )}
                  {post.comments.map((comment) => {
                    const commentUser = comment.user || {
                      fullName: "Unknown User",
                      username: "unknown",
                      profileImg: "/avatar-placeholder.png",
                    };
                    return (
                      <div key={comment._id} className="flex gap-2 items-start">
                        <div className="avatar">
                          <div className="w-8 rounded-full">
                            <img src={commentUser.profileImg} alt={`${commentUser.fullName}'s profile`} />
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="font-bold">{commentUser.fullName}</span>
                            <span className="text-gray-700 text-sm">@{commentUser.username}</span>
                          </div>
                          <div className="text-sm">{comment.text}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add comment */}
                <form
                  className="flex gap-2 items-center mt-4 border-t border-gray-600 pt-2"
                  onSubmit={handlePostComment}
                >
                  <textarea
                    className="textarea w-full p-1 rounded text-md resize-none border focus:outline-none border-gray-800"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <button className="btn btn-primary rounded-full btn-sm text-white px-4">
                    {isCommenting ? (<LoadingSpinner size="md"/>) : ("Post")}
                  </button>
                </form>
              </div>
              <form method="dialog" className="modal-backdrop">
                <button className="outline-none">close</button>
              </form>
            </dialog>

            {/* Repost */}
            <div className="flex gap-1 items-center group cursor-pointer">
              <BiRepost className="w-6 h-6 text-slate-500 group-hover:text-green-500" />
              <span className="text-sm text-slate-500 group-hover:text-green-500">0</span>
            </div>

            {/* Like */}
            <div className="flex gap-1 items-center group cursor-pointer" onClick={handleLikePost}>
              <FaRegHeart
                className={`w-4 h-4 cursor-pointer ${isLiked ? "text-pink-500" : "text-slate-500"} group-hover:text-pink-500`}
              />
              <span className={`text-sm ${isLiked ? "text-pink-500" : "text-slate-500"} group-hover:text-pink-500`}>
                {post.likes.length}
              </span>
            </div>
          </div>

          {/* Bookmark */}
          <div className="flex w-1/3 justify-end gap-2 items-center">
            <FaRegBookmark className="w-4 h-4 text-slate-500 cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Post;
