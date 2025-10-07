import { FaRegComment, FaRegHeart, FaTrash, FaRegBookmark } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";

const Post = ({ post }) => {
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);

  const postOwner = post.user || {
    username: "unknown",
    fullName: "Unknown User",
    profileImg: "/avatar-placeholder.png",
    _id: null,
  };

  const isMyPost = authUser && post.user && authUser._id === post.user._id;
  const isLiked = post.likes && authUser && post.likes.some(like => like._id === authUser._id);
  const formattedDate = new Date(post.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // ---------------- Comment Mutation ----------------
  const { mutate: commentPost, isLoading: isCommenting } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`http://localhost:7000/post/comment/${post._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: comment }),
        credentials: "include",
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data;
    },
    onSuccess: () => {
      toast.success("Comment added!");
      queryClient.invalidateQueries(["posts"]);
      setComment("");
    },
    onError: (err) => toast.error(err.message),
  });

  // ---------------- Delete Post Mutation ----------------
  const { mutate: deletePost, isLoading: isDeleting } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`http://localhost:7000/post/${post._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data;
    },
    onSuccess: () => {
      toast.success("Post deleted successfully!");
      queryClient.invalidateQueries(["posts"]);
    },
    onError: (err) => toast.error(err.message),
  });

  // ---------------- Like Mutation ----------------
  const { mutate: likePost, isLoading: isLiking } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`http://localhost:7000/post/like/${post._id}`, {
        method: "POST",
        credentials: "include",
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(["posts"]),
    onError: (err) => toast.error(err.message),
  });

  const handleDelete = () => deletePost();
  const handleComment = (e) => { e.preventDefault(); if (!isCommenting) commentPost(); };
  const handleLike = () => { if (!isLiking) likePost(); };

  return (
    <div className="flex gap-2 items-start p-4 border-b border-gray-700">
      <div className="avatar">
        <Link to={`/profile/${postOwner.username}`} className="w-8 rounded-full overflow-hidden">
          <img src={postOwner.profileImg} alt={`${postOwner.fullName}'s profile`} />
        </Link>
      </div>

      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="flex gap-2 items-center">
          <Link to={`/profile/${postOwner.username}`} className="font-bold">{postOwner.fullName}</Link>
          <span className="text-gray-700 flex gap-1 text-sm">
            <Link to={`/profile/${postOwner.username}`}>@{postOwner.username}</Link>
            <span>·</span>
            <span>{formattedDate}</span>
          </span>
          {isMyPost && (
            <span className="flex justify-end flex-1">
              {!isDeleting ? (
                <FaTrash className="cursor-pointer hover:text-red-500" onClick={handleDelete} />
              ) : (<LoadingSpinner size="sm" />)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 overflow-hidden">
          <span>{post.text}</span>
          {post.img && <img src={post.img} className="h-80 object-contain rounded-lg border border-gray-700" alt="Post content" />}
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-3">
          <div className="flex gap-4 items-center w-2/3 justify-between">
            {/* Comment */}
            <div className="flex gap-1 items-center cursor-pointer group" onClick={() => setShowComments(true)}>
              <FaRegComment className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
              <span className="text-sm text-slate-500 group-hover:text-sky-400">{post.comments.length}</span>
            </div>

            {/* Repost */}
            <div className="flex gap-1 items-center group cursor-pointer">
              <BiRepost className="w-6 h-6 text-slate-500 group-hover:text-green-500" />
              <span className="text-sm text-slate-500 group-hover:text-green-500">0</span>
            </div>

            {/* Like */}
            <div className="flex gap-1 items-center group cursor-pointer" onClick={handleLike}>
              <FaRegHeart className={`w-4 h-4 cursor-pointer ${isLiked ? "text-pink-500" : "text-slate-500"} group-hover:text-pink-500`} />
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

        {/* Comments Modal */}
        {showComments && (
          <dialog open className="modal border-none outline-none">
            <div className="modal-box rounded border border-gray-600">
              <h3 className="font-bold text-lg mb-4">COMMENTS</h3>
              <div className="flex flex-col gap-3 max-h-60 overflow-auto">
                {post.comments.length === 0 && <p className="text-sm text-slate-500">No comments yet 🤔</p>}
                {post.comments.map(c => {
                  const user = c.user || { fullName: "Unknown", username: "unknown", profileImg: "/avatar-placeholder.png" };
                  return (
                    <div key={c._id} className="flex gap-2 items-start">
                      <div className="avatar"><img src={user.profileImg} className="w-8 rounded-full" /></div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="font-bold">{user.fullName}</span>
                          <span className="text-gray-700 text-sm">@{user.username}</span>
                        </div>
                        <div className="text-sm">{c.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form className="flex gap-2 items-center mt-4 border-t border-gray-600 pt-2" onSubmit={handleComment}>
                <textarea className="textarea w-full p-1 rounded text-md resize-none border focus:outline-none border-gray-800" placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} />
                <button className="btn btn-primary rounded-full btn-sm text-white px-4">{isCommenting ? <LoadingSpinner size="md"/> : "Post"}</button>
              </form>
              <button className="mt-2 btn btn-sm" onClick={() => setShowComments(false)}>Close</button>
            </div>
          </dialog>
        )}
      </div>
    </div>
  );
};

export default Post;
