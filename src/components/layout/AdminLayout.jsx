import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isSuperAdmin = user?.role === "SuperAdmin" || user?.Role === "SuperAdmin";

  // Block indexing and tracking for admin pages
  useEffect(() => {
    // Add noindex meta tag
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.name = "robots";
      document.head.appendChild(metaRobots);
    }
    metaRobots.content = "noindex, nofollow, noarchive";

    // Add nosnippet meta tag
    let metaGoogle = document.querySelector('meta[name="googlebot"]');
    if (!metaGoogle) {
      metaGoogle = document.createElement("meta");
      metaGoogle.name = "googlebot";
      document.head.appendChild(metaGoogle);
    }
    metaGoogle.content = "noindex, nofollow";

    // Disable any analytics by setting a flag
    window.__PLATERLY_ADMIN_MODE__ = true;

    return () => {
      // Cleanup on unmount
      window.__PLATERLY_ADMIN_MODE__ = false;
    };
  }, []);

  const navItems = [
    { path: "/admin", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { path: "/admin/prohibited-ingredients", label: "Prohibited Ingredients", icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" },
    { path: "/admin/categories", label: "Categories", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { path: "/admin/ingredients", label: "Global Ingredients", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { path: "/admin/substitutions", label: "Substitutions", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
  ];

  const superAdminItems = [
    { path: "/admin/users", label: "User Management", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { path: "/admin/audit-logs", label: "Audit Logs", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <header className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="flex items-center space-x-2">
                <span className="text-xl font-bold text-orange-400">Recipzee</span>
                <span className="bg-red-600 text-xs px-2 py-1 rounded font-semibold">ADMIN</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">
                {user?.username || user?.email}
                <span className="ml-2 bg-orange-600 text-xs px-2 py-0.5 rounded">
                  {user?.role || user?.Role}
                </span>
              </span>
              <Link
                to="/feed"
                className="text-sm text-gray-300 hover:text-white transition"
              >
                Back to App
              </Link>
              <button
                onClick={logout}
                className="text-sm text-gray-300 hover:text-white transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md min-h-screen">
          <nav className="p-4 space-y-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Admin Panel
            </div>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                  isActive(item.path)
                    ? "bg-orange-100 text-orange-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}

            {isSuperAdmin && (
              <>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-3">
                  Super Admin
                </div>
                {superAdminItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                      isActive(item.path)
                        ? "bg-red-100 text-red-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
