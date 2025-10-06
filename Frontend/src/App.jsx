import React from 'react'
import { Route, Routes } from 'react-router-dom'
import LoginPage from './pages/auth/login/LoginPage'
import SignUpPage from './pages/auth/signup/SignUpPage'
import HomePage from './pages/Home/HomePage'
import Sidebar from './components/common/Sidebar'
import RightPanel from './components/common/RightPanel'
import NotificationPage from './pages/Notification/NotificationPage'
import ProfilePage from './pages/profile/ProfilePage'

const App = () => {
  return (
    <div className='flex max-w-6xl mx-auto'>
    <Sidebar/>
      <Routes>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/signup" element={<SignUpPage/>}/>
        <Route path="/homepage" element={<HomePage />}/>
        <Route path="/notifications" element={<NotificationPage/>}/>
        <Route path="/profile/:username" element={<ProfilePage/>} />
      </Routes>
      <RightPanel/>
    </div>
  )
}

export default App