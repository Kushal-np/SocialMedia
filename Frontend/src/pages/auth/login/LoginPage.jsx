import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import XSvg from "../../../components/svgs/X";
import { MdOutlineMail, MdPassword } from "react-icons/md";

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: async ({ username, password }) => {
      const res = await fetch("http://localhost:7000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid credentials");
      return data;
    },

    onSuccess: async (data) => {
      toast.success("Login successful!");
      console.log("User logged in:", data);

      // 🔁 Option 1: Refetch authUser
      await queryClient.invalidateQueries(["authUser"]);

      // ⚡ OR Option 2: Set manually
      // queryClient.setQueryData(["authUser"], data);

      navigate("/homepage");
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate(formData);
  };

  return (
    <div className='max-w-screen-xl mx-auto flex h-screen'>
      <div className='flex-1 hidden lg:flex items-center justify-center'>
        <XSvg className='lg:w-2/3 fill-white' />
      </div>

      <div className='flex-1 flex flex-col justify-center items-center'>
        <form className='flex gap-4 flex-col w-2/3' onSubmit={handleSubmit}>
          <XSvg className='w-24 lg:hidden fill-white' />
          <h1 className='text-4xl font-extrabold text-white'>Let's go.</h1>

          <label className='input input-bordered rounded flex items-center gap-2'>
            <MdOutlineMail />
            <input
              type='text'
              className='grow'
              placeholder='Username'
              name='username'
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              value={formData.username}
              required
            />
          </label>

          <label className='input input-bordered rounded flex items-center gap-2'>
            <MdPassword />
            <input
              type='password'
              className='grow'
              placeholder='Password'
              name='password'
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              value={formData.password}
              required
            />
          </label>

          <button
            type='submit'
            className='btn rounded-full btn-primary text-white'
            disabled={isPending}
          >
            {isPending ? "Logging in..." : "Login"}
          </button>

          {isError && <p className='text-red-500 mt-2'>{error.message}</p>}
        </form>

        <div className='flex flex-col gap-2 mt-4'>
          <p className='text-white text-lg'>Don't have an account?</p>
          <Link to='/signup'>
            <button className='btn rounded-full btn-primary text-white btn-outline w-full'>
              Sign up
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
