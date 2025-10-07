import { Link } from "react-router-dom";
import RightPanelSkeleton from "../skeletons/RightPanelSkeleton";
import { useQuery } from "@tanstack/react-query";
import useFollow from "../../hooks/useFollow";
import LoadingSpinner from "./LoadingSpinner";

const RightPanel = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["suggestedUsers"],
    queryFn: async () => {
      const res = await fetch(`http://localhost:7000/user/suggested`, {
        credentials: "include",
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      return data;
    },
  });

  const { follow, isLoading: followLoading } = useFollow();

  if (isLoading) {
    return (
      <div className="hidden lg:block my-4 mx-2">
        <div className="bg-[#16181C] p-4 rounded-md sticky top-2">
          <p className="font-bold">Who to follow</p>
          <RightPanelSkeleton />
          <RightPanelSkeleton />
          <RightPanelSkeleton />
          <RightPanelSkeleton />
        </div>
      </div>
    );
  }

  if (isError) {
    console.error("Error fetching suggested users:", error);
    return null;
  }

  const suggestedUsers = data?.suggestedUsers || [];

  return (
    <div className="hidden lg:block my-4 mx-2">
      <div className="bg-[#16181C] p-4 rounded-md sticky top-2">
        <p className="font-bold mb-3">Who to follow</p>
        <div className="flex flex-col gap-4">
          {suggestedUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">No suggestions right now</p>
          ) : (
            suggestedUsers.map((user) => (
              <Link
                to={`/profile/${user.username}`}
                className="flex items-center justify-between gap-4"
                key={user._id}
              >
                <div className="flex gap-2 items-center">
                  <div className="avatar">
                    <div className="w-8 rounded-full">
                      <img
                        src={user.profileImg || "/avatar-placeholder.png"}
                        alt={user.fullName}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold tracking-tight truncate w-28">
                      {user.fullName}
                    </span>
                    <span className="text-sm text-slate-500">@{user.username}</span>
                  </div>
                </div>
                <button
                  className="btn bg-white text-black hover:bg-white hover:opacity-90 rounded-full btn-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    follow(user._id);
                  }}
                  disabled={followLoading}
                >
                  {followLoading ? <LoadingSpinner size="sm" /> : "Follow"}
                </button>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
