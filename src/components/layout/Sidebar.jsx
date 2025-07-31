import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, PlusCircle, Book, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const Sidebar = () => {
  const location = useLocation()
  const { user } = useAuth()

  const isActive = (path) => location.pathname === path

  return (
    <div className="bg-platerly-light text-platerly-text w-[260px] h-screen fixed top-0 left-0 p-6 flex flex-col justify-between border-r border-platerly-border">
      <div>
        <div className="text-3xl font-bold text-platerly-green mb-10">Platerly</div>

        {user ? (
          <nav className="flex flex-col space-y-4">
            <Link
              to="/feed"
              className={`flex items-center gap-4 text-lg px-4 py-2 rounded-md transition ${
                isActive('/feed')
                  ? 'bg-platerly-green text-white'
                  : 'hover:bg-platerly-card hover:text-white'
              }`}
            >
              <Home className="w-6 h-6" />
              Feed
            </Link>

            <Link
              to="/explore-chefs"
              className={`flex items-center gap-4 text-lg px-4 py-2 rounded-md transition ${
                isActive('/explore-chefs')
                  ? 'bg-platerly-green text-white'
                  : 'hover:bg-platerly-card hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 1.2.3 2.33.84 3.33-.53.19-.84.7-.84 1.22v2c0 .55.45 1 1 1h2v3c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-3h2c.55 0 1-.45 1-1v-2c0-.52-.31-1.03-.84-1.22A6.964 6.964 0 0 0 19 9c0-3.87-3.13-7-7-7z" />
              </svg>
              Explore Chefs
            </Link>

            <Link
              to="/create"
              className={`flex items-center gap-4 text-lg px-4 py-2 rounded-md transition ${
                isActive('/create')
                  ? 'bg-platerly-green text-white'
                  : 'hover:bg-platerly-card hover:text-white'
              }`}
            >
              <PlusCircle className="w-6 h-6" />
              Create Recipe
            </Link>

            <Link
              to="/cookbooks"
              className={`flex items-center gap-4 text-lg px-4 py-2 rounded-md transition ${
                isActive('/cookbooks')
                  ? 'bg-platerly-green text-white'
                  : 'hover:bg-platerly-card hover:text-white'
              }`}
            >
              <Book className="w-6 h-6" />
              My Cookbooks
            </Link>

            <Link
              to="/settings"
              className={`flex items-center gap-4 text-lg px-4 py-2 rounded-md transition ${
                location.pathname.startsWith('/settings')
                  ? 'bg-platerly-green text-white'
                  : 'hover:bg-platerly-card hover:text-white'
              }`}
            >
              <Settings className="w-6 h-6" />
              Settings
            </Link>
          </nav>
        ) : (
          <div className="mt-10">
            <p className="mb-4 text-gray-300 text-sm">Join Platerly to create and save recipes</p>
            <Link
              to="/register"
              className="block text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition"
            >
              Join Platerly
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
