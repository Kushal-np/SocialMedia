import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import LoginPage from './pages/auth/login/LoginPage';
import SignUpPage from './pages/auth/signup/SignUpPage';
import HomePage from './pages/Home/HomePage';
import Sidebar from './components/common/Sidebar';
import RightPanel from './components/common/RightPanel';
import NotificationPage from './pages/Notification/NotificationPage';
import ProfilePage from './pages/profile/ProfilePage';
import LoadingSpinner from './components/common/LoadingSpinner';

const App = () => {
  const { data: authUser, isLoading, isError } = useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      const res = await fetch("http://localhost:7000/auth/me", {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Not authenticated");
      return data.user; // Return the user object directly
    },
    retry: false,
    staleTime: 0, // Always refetch
    cacheTime: 0, // Do not cache
  });

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex max-w-6xl mx-auto">
      {authUser && <Sidebar authUser={authUser} />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/homepage" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="*" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/notifications" element={authUser ? <NotificationPage /> : <Navigate to="/login" />} />
        <Route path="/profile/:username" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>
      {authUser && <RightPanel />}
      <Toaster />
    </div>
  );
};

export default App;
