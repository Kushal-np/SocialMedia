import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import Posts from "../../components/common/Posts";
import EditProfileModal from "./EditProfileModal";
import useFollow from "../../hooks/useFollow";
import useUpdateUserProfile from "../../hooks/useUpdateUserProfile";

import { FaArrowLeft, FaLink } from "react-icons/fa";
import { IoCalendarOutline } from "react-icons/io5";
import { MdEdit } from "react-icons/md";
import { formatMemberSinceDate } from "../../utils/date";

const ProfilePage = () => {
  const { username } = useParams();
  const [coverImg, setCoverImg] = useState(null);
  const [profileImg, setProfileImg] = useState(null);
  const [feedType, setFeedType] = useState("posts");

  const coverImgRef = useRef(null);
  const profileImgRef = useRef(null);

  const { follow, isPending: isFollowPending } = useFollow();
  const { updateProfile, isUpdatingProfile } = useUpdateUserProfile();

  // Authenticated user
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });

  // Profile user
  const {
    data: user,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["userProfile", username],
    queryFn: async () => {
      const res = await fetch(`http://localhost:7000/user/profile/${username}`, {
        credentials: "include",
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data;
    },
  });

  // Posts by this user only
  const {
    data: userPosts,
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: ["userPosts", username],
    queryFn: async () => {
      const res = await fetch(`http://localhost:7000/post/user/${username}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch posts");
      return data.posts || [];
    },
  });

  const isMyProfile = authUser?._id === user?._id;
  const amIFollowing = authUser?.following?.includes(user?._id);
  const memberSinceDate = formatMemberSinceDate(user?.createdAt);

  const handleImgChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (type === "cover") setCoverImg(reader.result);
      if (type === "profile") setProfileImg(reader.result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    refetch();
    refetchPosts();
  }, [username]);

  if (isLoading || isRefetching) return <p className="text-center mt-4">Loading profile...</p>;
  if (!user) return <p className="text-center mt-4">User not found</p>;

  return (
    <div className="flex-[4_4_0] border-r border-gray-700 min-h-screen">
      {/* Header */}
      <div className="flex gap-4 px-4 py-2 items-center">
        <Link to="/">
          <FaArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex flex-col">
          <p className="font-bold text-lg">{user.fullName}</p>
          <span className="text-sm text-slate-500">{userPosts?.length || 0} posts</span>
        </div>
      </div>

      {/* Cover Image */}
      <div className="relative group">
        <img
          src={coverImg || user.coverImg || "/cover.png"}
          alt="cover"
          className="w-full h-52 object-cover"
        />
        {isMyProfile && (
          <div
            className="absolute top-2 right-2 p-2 bg-gray-800 bg-opacity-75 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition"
            onClick={() => coverImgRef.current.click()}
          >
            <MdEdit className="w-5 h-5 text-white" />
          </div>
        )}
        <input
          type="file"
          hidden
          accept="image/*"
          ref={coverImgRef}
          onChange={(e) => handleImgChange(e, "cover")}
        />

        {/* Profile Avatar */}
        <div className="avatar absolute -bottom-16 left-4">
          <div className="w-32 rounded-full relative group">
            <img
              src={profileImg || user.profileImg || "/avatar-placeholder.png"}
              alt="profile"
              className="w-full h-full object-cover rounded-full border-4 border-gray-900"
            />
            {isMyProfile && (
              <div
                className="absolute top-2 right-2 p-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 cursor-pointer"
                onClick={() => profileImgRef.current.click()}
              >
                <MdEdit className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          <input
            type="file"
            hidden
            accept="image/*"
            ref={profileImgRef}
            onChange={(e) => handleImgChange(e, "profile")}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end px-4 mt-20 gap-2">
        {isMyProfile && <EditProfileModal authUser={authUser} />}
        {!isMyProfile && (
          <button
            className="btn btn-outline rounded-full btn-sm"
            onClick={() => follow(user._id)}
          >
            {isFollowPending ? "Loading..." : amIFollowing ? "Unfollow" : "Follow"}
          </button>
        )}
        {(coverImg || profileImg) && isMyProfile && (
          <button
            className="btn btn-primary rounded-full btn-sm text-white px-4"
            onClick={async () => {
              await updateProfile({ coverImg, profileImg });
              setCoverImg(null);
              setProfileImg(null);
            }}
          >
            {isUpdatingProfile ? "Updating..." : "Update"}
          </button>
        )}
      </div>

      {/* User Info */}
      <div className="flex flex-col gap-2 mt-4 px-4">
        <span className="font-bold text-lg">{user.fullName}</span>
        <span className="text-sm text-slate-500">@{user.username}</span>
        {user.bio && <span className="text-sm my-1">{user.bio}</span>}

        <div className="flex gap-4 flex-wrap items-center text-sm text-slate-500">
          {user.link && (
            <div className="flex gap-1 items-center">
              <FaLink className="w-3 h-3" />
              <a
                href={user.link}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline"
              >
                {user.link}
              </a>
            </div>
          )}
          <div className="flex gap-1 items-center">
            <IoCalendarOutline className="w-4 h-4" />
            {memberSinceDate}
          </div>
        </div>

        <div className="flex gap-4 mt-2">
          <span className="font-bold text-xs">{user.following?.length || 0} Following</span>
          <span className="font-bold text-xs">{user.followers?.length || 0} Followers</span>
        </div>
      </div>

      {/* Feed Type Tabs */}
      <div className="flex w-full border-b border-gray-700 mt-4">
        {["posts", "likes"].map((type) => (
          <div
            key={type}
            className={`flex-1 text-center p-3 cursor-pointer hover:bg-secondary relative ${
              feedType === type ? "font-bold" : "text-slate-500"
            }`}
            onClick={() => setFeedType(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
            {feedType === type && (
              <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary mx-auto left-0 right-0" />
            )}
          </div>
        ))}
      </div>

      {/* Posts */}
      {postsLoading ? (
        <p className="text-center mt-4">Loading posts...</p>
      ) : (
        <Posts feedType={feedType} posts={userPosts || []} userId={user?._id} />
      )}
    </div>
  );
};

export default ProfilePage;
