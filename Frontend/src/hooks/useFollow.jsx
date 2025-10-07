import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const useFollow = () => {
  const queryClient = useQueryClient();

  const { mutate: follow, isLoading } = useMutation({
    mutationFn: async (userId) => {
      try {
        const res = await fetch(`http://localhost:7000/user/follow/${userId}`, {
          method: "POST",
          credentials: "include",
        });

        const text = await res.text();
        const data = text ? JSON.parse(text) : {};

        if (!res.ok) {
          throw new Error(data.error || "Something went wrong!");
        }

        return data;
      } catch (error) {
        throw new Error(error.message || "Something went wrong!");
      }
    },
    onSuccess: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["suggestedUsers"] }),
        queryClient.invalidateQueries({ queryKey: ["authUser"] }),
      ]);
      toast.success("User followed successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return { follow, isLoading };
};

export default useFollow;
