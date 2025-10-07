import { CiImageOn } from "react-icons/ci";
import { BsEmojiSmileFill } from "react-icons/bs";
import { IoCloseSharp } from "react-icons/io5";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

const CreatePost = () => {
  const [text, setText] = useState("");
  const [img, setImg] = useState(null);
  const imgRef = useRef(null);

  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);

  const { mutate: createPost, isLoading: isPending } = useMutation({
    mutationFn: async (formData) => {
      const res = await fetch("http://localhost:7000/post/create", {
        method: "POST",
        credentials: "include",
        body: formData, // send FormData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");
      return data;
    },
    onSuccess: () => {
      setText("");
      setImg(null);
      if (imgRef.current) imgRef.current.value = null;
      toast.success("Post created successfully!");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() && !img) {
      toast.error("Post cannot be empty!");
      return;
    }

    const formData = new FormData();
    formData.append("text", text);
    if (img) formData.append("img", img); // file from input

    createPost(formData);
  };

  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImg(file);
    }
  };

  if (!authUser) return null;

  return (
    <div className="flex p-4 items-start gap-4 border-b border-gray-700">
      {/* Avatar */}
      <div className="avatar">
        <div className="w-8 rounded-full">
          <img src={authUser.profileImg || "/avatar-placeholder.png"} alt="User Avatar" />
        </div>
      </div>

      <form className="flex flex-col gap-2 w-full" onSubmit={handleSubmit}>
        <textarea
          className="textarea w-full p-0 text-lg resize-none border-none focus:outline-none border-gray-800"
          placeholder={`What's happening, ${authUser.fullName}?`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {img && (
          <div className="relative w-72 mx-auto">
            <IoCloseSharp
              className="absolute top-0 right-0 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer"
              onClick={() => {
                setImg(null);
                if (imgRef.current) imgRef.current.value = null;
              }}
            />
            <img
              src={URL.createObjectURL(img)}
              className="w-full mx-auto h-72 object-contain rounded"
              alt="Preview"
            />
          </div>
        )}

        <div className="flex justify-between border-t py-2 border-t-gray-700">
          <div className="flex gap-1 items-center">
            <CiImageOn className="fill-primary w-6 h-6 cursor-pointer" onClick={() => imgRef.current.click()} />
            <BsEmojiSmileFill className="fill-primary w-5 h-5 cursor-pointer" />
          </div>

          <input type="file" hidden ref={imgRef} onChange={handleImgChange} />
          <button
            type="submit"
            className="btn btn-primary rounded-full btn-sm text-white px-4"
            disabled={isPending}
          >
            {isPending ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
