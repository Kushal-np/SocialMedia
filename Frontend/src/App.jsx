import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/auth/login/LoginPage'
import SignUpPage from './pages/auth/signup/SignUpPage'
import HomePage from './pages/Home/HomePage'
import Sidebar from './components/common/Sidebar'
import RightPanel from './components/common/RightPanel'
import NotificationPage from './pages/Notification/NotificationPage'
import ProfilePage from './pages/profile/ProfilePage'
import { Toaster } from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import LoadingSpinner from './components/common/LoadingSpinner'

const App = () => {
  const {data:authUser , isLoading}= useQuery({
    queryKey:['authUser'] , 
    queryFn:async() =>{
      try{
        const res = await fetch("http://localhost:7000/auth/me" , {
          credentials:"include"
        });
        const data = await res.json();
        if(!res.ok){
          throw new Error(data.error || "Something went wrong")
        }
        console.log("authUser is here" , data);
        return data;
      } 
      catch(error){
        throw new Error(error);
      }
    }
  })
  if(isLoading){
    return(
      <div className='h-screen flex justify-center items-center'>
        <LoadingSpinner />
      </div>
    )
  }
  return (
    <div className='flex max-w-6xl mx-auto'>
      {authUser && <Sidebar />}
      <Routes>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/signup" element={<SignUpPage/>}/>
        <Route path="/homepage" element={authUser? <HomePage /> : <Navigate to="/login" />}/>
        <Route path="*" element={authUser? <HomePage /> : <Navigate to="/login" />}/>
        <Route path="/notifications" element={authUser?  <NotificationPage/> : <LoginPage />}/>
        <Route path="/profile/:username" element={authUser ?<ProfilePage/> : <LoginPage />} />
      </Routes>
      {authUser &&< RightPanel />}
      <Toaster/>
    </div>
  )
}

export default App