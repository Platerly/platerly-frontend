import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import Feed from './pages/Feed'
import CreateRecipe from './pages/CreateRecipe'
import RemixPage from './pages/RemixPage'
import './index.css'
import RecipeDetailsPage from './pages/RecipeDetailsPage'
import CookbookPage from './pages/CookbookPage'
import CookbookDetailsPage from "./pages/CookbookDetailsPage"
import AllergySettingsPage from './pages/AllergySettingsTab'
import UserProfilePage from './pages/UserProfilePage'
import SearchResultsPage from './pages/SearchResultsPage'
import MyProfileSettingsPage from './pages/EditProfileTab'
import ExploreChefsPage from './pages/ExploreChefsPage'
import SettingsPage from './pages/SettingsPage' 
import PrivateRoute from './components/auth/PrivateRoute'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public pages (no layout) */}
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        {/* Authenticated pages (with AppLayout) */}
        <Route path="/feed" element={<AppLayout><Feed /></AppLayout>} />
        <Route path="/create" element={<PrivateRoute><AppLayout><CreateRecipe /></AppLayout></PrivateRoute>} />
        <Route path="/remix/:originalId" element={<PrivateRoute><AppLayout><RemixPage /></AppLayout></PrivateRoute>} />
        <Route path="/recipe/:id" element={<AppLayout><RecipeDetailsPage /></AppLayout>} />
        <Route path="/cookbooks" element={<PrivateRoute><AppLayout><CookbookPage /></AppLayout></PrivateRoute>} />
        <Route path="/cookbook/:id" element={<PrivateRoute><AppLayout><CookbookDetailsPage /></AppLayout></PrivateRoute>} />
        <Route path="/settings/allergies" element={<PrivateRoute><AppLayout><AllergySettingsPage /></AppLayout></PrivateRoute>} />
        <Route path="/settings/profile" element={<PrivateRoute><AppLayout><MyProfileSettingsPage /></AppLayout></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><AppLayout><SettingsPage /></AppLayout></PrivateRoute>} />
        <Route path="/profile/:username" element={<AppLayout><UserProfilePage /></AppLayout>} />
        <Route path="/search" element={<AppLayout><SearchResultsPage /></AppLayout>} />
        <Route path="/explore-chefs" element={<PrivateRoute><AppLayout><ExploreChefsPage /></AppLayout></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
