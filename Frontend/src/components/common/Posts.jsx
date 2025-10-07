import PostSkeleton from "../skeletons/PostSkeleton";
import Post from "./Post";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";

const Posts = ({ feedType }) => {
  const getPostEndPoint = (feedType) => {
    switch (feedType) {
      case "forYou":
        return "http://localhost:7000/post/AllPosts";
      case "following":
        return "http://localhost:7000/post/following";
      default:
        return "http://localhost:7000/post/AllPosts";
    }
  };

  const POST_ENDPOINT = getPostEndPoint(feedType);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["posts", feedType],
    queryFn: async () => {
      try {
        const res = await fetch(POST_ENDPOINT, {
          credentials: "include",
        });
        if (res.status === 401) {
          throw new Error("Unauthorized");
        }
        const result = await res.json();
        return result.posts || [];
      } catch (error) {
        throw error;
      }
    },
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (isError) {
    console.error("Error fetching posts:", error.message);
    if (error.message === "Unauthorized") {
      return <p className="text-center my-4">Please log in to view posts from users you follow.</p>;
    }
    return <Navigate to="/login" />;
  }

  if (!data || data.length === 0) {
    return <p className="text-center my-4">No posts in this tab. Switch 👻</p>;
  }

  return (
    <div>
      {data.map((post) => (
        <Post key={post._id} post={post} />
      ))}
    </div>
  );
};

export default Posts;
