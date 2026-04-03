/**
 * UserManagementPage.jsx
 * Layer: Admin (SuperAdmin only)
 *
 * Allows SuperAdmins to:
 *   1. Search for any registered user by username or email
 *      (GET /api/superadmin/users/search?query=)
 *   2. Promote a User to Moderator or Admin
 *      (POST /api/superadmin/promote  { userId, newRole })
 *   3. Demote any Admin/Moderator back to User
 *      (POST /api/superadmin/demote   { userId })
 *   4. View the full list of current admin-level accounts
 *      (GET /api/superadmin/admins)
 *
 * SuperAdmin accounts cannot be demoted from this UI — the "Demote" button
 * is suppressed for any row where role === "SuperAdmin".
 *
 * All promote/demote actions are confirmed via window.confirm before the
 * API call is made, and are automatically recorded in the audit log by
 * the backend.
 *
 * Access: SuperAdmin role required. The route should be guarded in the
 * admin layout; this page also shows a red security-warning banner as a
 * secondary reminder.
 */
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../utils/api";

/**
 * @returns {JSX.Element}
 */
const UserManagementPage = () => {
  const { token } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const authHeader = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/superadmin/admins`, {
        headers: authHeader,
      });
      if (!res.ok) throw new Error("Failed to fetch admins");
      const data = await res.json();
      setAdmins(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAdmins();
  }, [token]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/superadmin/users/search?query=${encodeURIComponent(searchQuery)}`,
        { headers: authHeader }
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handlePromote = async (userId, newRole) => {
    if (!confirm(`Are you sure you want to promote this user to ${newRole}?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/superadmin/promote`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to promote user");
      }

      setSuccess(`User promoted to ${newRole} successfully`);
      await fetchAdmins();
      setSearchResults([]);
      setSearchQuery("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDemote = async (userId) => {
    if (!confirm("Are you sure you want to demote this admin to regular user?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/superadmin/demote`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to demote user");
      }

      setSuccess("Admin demoted successfully");
      await fetchAdmins();
    } catch (err) {
      setError(err.message);
    }
  };

  // Badge colour map for every possible role value
  const roleColors = {
    User: "bg-gray-100 text-gray-800",
    Moderator: "bg-blue-100 text-blue-800",
    Admin: "bg-orange-100 text-orange-800",
    SuperAdmin: "bg-red-100 text-red-800",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Manage admin users and permissions</p>
      </div>

      {/* Security Warning */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-red-800">SuperAdmin Only</h3>
            <p className="text-sm text-red-700 mt-1">
              Only SuperAdmins can promote/demote users. All actions are logged.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4">
          {success}
          <button onClick={() => setSuccess("")} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Search for Users */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Promote User to Admin</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username or email..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 border rounded-lg divide-y">
            {searchResults.map((user) => (
              <div key={user.id} className="p-3 flex justify-between items-center">
                <div>
                  <span className="font-medium">{user.username}</span>
                  <span className="text-gray-500 ml-2">{user.email}</span>
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${roleColors[user.role]}`}>
                    {user.role}
                  </span>
                </div>
                <div className="flex gap-2">
                  {user.role === "User" && (
                    <>
                      <button
                        onClick={() => handlePromote(user.id, "Moderator")}
                        className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                      >
                        Make Moderator
                      </button>
                      <button
                        onClick={() => handlePromote(user.id, "Admin")}
                        className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded hover:bg-orange-200"
                      >
                        Make Admin
                      </button>
                    </>
                  )}
                  {user.role === "Moderator" && (
                    <button
                      onClick={() => handlePromote(user.id, "Admin")}
                      className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded hover:bg-orange-200"
                    >
                      Make Admin
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Admins */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Current Admin Users</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{admin.username}</div>
                  <div className="text-sm text-gray-500">{admin.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${roleColors[admin.role]}`}>
                    {admin.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {admin.roleAssignedAt
                    ? new Date(admin.roleAssignedAt).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="px-6 py-4">
                  {/* SuperAdmins are intentionally excluded from demotion via this UI */}
                  {admin.role !== "SuperAdmin" && (
                    <button
                      onClick={() => handleDemote(admin.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Demote to User
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {admins.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No admin users found.
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;
