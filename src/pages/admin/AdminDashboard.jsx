import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../utils/api";
import RecipeIndexPanel from "./RecipeIndexPanel";

const AdminDashboard = () => {
  const { token, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const authHeader = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch various admin stats
        const [prohibited, categories, substitutions] = await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/prohibited-ingredients`, { headers: authHeader }).then(r => r.json()).catch(() => []),
          fetch(`${API_BASE_URL}/api/admin/categories`, { headers: authHeader }).then(r => r.json()).catch(() => []),
          fetch(`${API_BASE_URL}/api/admin/substitutions`, { headers: authHeader }).then(r => r.json()).catch(() => []),
        ]);

        setStats({
          prohibitedCount: Array.isArray(prohibited) ? prohibited.length : 0,
          categoriesCount: Array.isArray(categories) ? categories.length : 0,
          substitutionsCount: Array.isArray(substitutions) ? substitutions.length : 0,
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchStats();
  }, [token, authHeader]);

  const isSuperAdmin = user?.role === "SuperAdmin" || user?.Role === "SuperAdmin";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.displayName || user?.username}
        </p>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
            <p className="text-sm text-yellow-700 mt-1">
              This admin panel is not indexed by search engines. All actions are logged for security purposes.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Prohibited Ingredients"
          value={loading ? "..." : stats?.prohibitedCount || 0}
          icon="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          color="red"
        />
        <StatCard
          title="Ingredient Categories"
          value={loading ? "..." : stats?.categoriesCount || 0}
          icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          color="blue"
        />
        <StatCard
          title="Substitution Rules"
          value={loading ? "..." : stats?.substitutionsCount || 0}
          icon="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            to="/admin/prohibited-ingredients"
            label="Manage Prohibited"
            description="Block harmful ingredients"
            color="red"
          />
          <QuickAction
            to="/admin/categories"
            label="Manage Categories"
            description="Organize ingredients"
            color="blue"
          />
          <QuickAction
            to="/admin/substitutions"
            label="Manage Substitutions"
            description="Set up ingredient alternatives"
            color="green"
          />
          {isSuperAdmin && (
            <QuickAction
              to="/admin/users"
              label="User Management"
              description="Manage admin users"
              color="purple"
            />
          )}
        </div>
      </div>

      {/* Recipe Index Engine panel */}
      <RecipeIndexPanel token={token} />

      {/* Role Info */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${isSuperAdmin ? 'bg-red-500' : 'bg-orange-500'}`}></div>
          <span className="text-sm text-gray-600">
            You are logged in as <strong>{user?.role || user?.Role}</strong>
            {isSuperAdmin && " with full access to all admin features"}
          </span>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

const QuickAction = ({ to, label, description, color }) => {
  const colors = {
    red: "hover:border-red-300 hover:bg-red-50",
    blue: "hover:border-blue-300 hover:bg-blue-50",
    green: "hover:border-green-300 hover:bg-green-50",
    purple: "hover:border-purple-300 hover:bg-purple-50",
  };

  return (
    <a
      href={to}
      className={`block p-4 border border-gray-200 rounded-lg transition ${colors[color]}`}
    >
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </a>
  );
};

export default AdminDashboard;
