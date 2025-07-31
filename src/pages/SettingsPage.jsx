import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EditProfileTab from './EditProfileTab'
import AllergySettingsTab from './AllergySettingsTab'
import {useAuth} from '../context/AuthContext'




const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const navigate = useNavigate()
  const { logout } = useAuth()
  const handleLogout = () => {
    logout()
    navigate('/login')              // Redirect to login
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 text-white">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {/* Tab Switcher */}
      <div className="flex gap-4 border-b border-neutral-700 mb-8">
        <button
          className={`pb-2 font-medium ${
            activeTab === 'profile' ? 'border-b-2 border-green-500 text-green-400' : 'text-gray-400'
          }`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`pb-2 font-medium ${
            activeTab === 'allergies' ? 'border-b-2 border-green-500 text-green-400' : 'text-gray-400'
          }`}
          onClick={() => setActiveTab('allergies')}
        >
          Allergies
        </button>
      </div>

      {/* Tab Content */}
      <div className="mb-12">
        {activeTab === 'profile' ? <EditProfileTab /> : <AllergySettingsTab />}
      </div>

      {/* Logout Button */}
      <div className="border-t border-neutral-700 pt-6 text-right">
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
        >
          Log Out
        </button>
      </div>
    </div>
  )
}

export default SettingsPage
