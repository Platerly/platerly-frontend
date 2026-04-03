/**
 * ProhibitedIngredientsPage.jsx
 * Layer: Admin
 *
 * Full CRUD management UI for the prohibited-ingredients blocklist.
 * Each entry specifies a keyword that the allergen scan engine matches
 * against recipe ingredient text.
 *
 * Operations:
 *   - List:   GET  /api/admin/prohibited-ingredients
 *   - Create: POST /api/admin/prohibited-ingredients
 *   - Update: PUT  /api/admin/prohibited-ingredients/:id
 *   - Delete: DELETE /api/admin/prohibited-ingredients/:id
 *
 * Form fields:
 *   - keyword    — the text to match
 *   - category   — Haram | Allergen | Health | Dangerous
 *   - severity   — Low | Medium | High | Critical
 *   - matchType  — Exact | Contains | StartsWith | Regex
 *   - isActive   — whether the rule is currently enforced
 *   - reason / adminNotes — human-readable context, not shown to end users
 *
 * Access: JWT-authenticated admin users only.
 */
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../utils/api";

/**
 * @returns {JSX.Element}
 */
const ProhibitedIngredientsPage = () => {
  const { token } = useAuth();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    keyword: "",
    reason: "",
    category: "Haram",
    severity: "High",
    matchType: "Contains",
    isActive: true,
    adminNotes: "",
  });

  const authHeader = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const fetchIngredients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/prohibited-ingredients`, {
        headers: authHeader,
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setIngredients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchIngredients();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // When editingId is set, issue a PUT to update; otherwise POST to create
      const url = editingId
        ? `${API_BASE_URL}/api/admin/prohibited-ingredients/${editingId}`
        : `${API_BASE_URL}/api/admin/prohibited-ingredients`;

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save");

      await fetchIngredients();
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/prohibited-ingredients/${id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchIngredients();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      keyword: item.keyword,
      reason: item.reason || "",
      category: item.category,
      severity: item.severity,
      matchType: item.matchType,
      isActive: item.isActive,
      adminNotes: item.adminNotes || "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({
      keyword: "",
      reason: "",
      category: "Haram",
      severity: "High",
      matchType: "Contains",
      isActive: true,
      adminNotes: "",
    });
  };

  // Badge colour maps — keyed on the enum values returned by the API
  const categoryColors = {
    Haram: "bg-red-100 text-red-800",
    Allergen: "bg-yellow-100 text-yellow-800",
    Health: "bg-purple-100 text-purple-800",
    Dangerous: "bg-gray-100 text-gray-800",
  };

  const severityColors = {
    Low: "bg-green-100 text-green-800",
    Medium: "bg-yellow-100 text-yellow-800",
    High: "bg-orange-100 text-orange-800",
    Critical: "bg-red-100 text-red-800",
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prohibited Ingredients</h1>
          <p className="text-gray-600 mt-1">Manage ingredients that are blocked from recipes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          Add New
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Prohibited Ingredient" : "Add Prohibited Ingredient"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
                <input
                  type="text"
                  value={form.keyword}
                  onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="Haram">Haram</option>
                  <option value="Allergen">Allergen</option>
                  <option value="Health">Health</option>
                  <option value="Dangerous">Dangerous</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Match Type</label>
                <select
                  value={form.matchType}
                  onChange={(e) => setForm({ ...form, matchType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="Exact">Exact</option>
                  <option value="Contains">Contains</option>
                  <option value="StartsWith">Starts With</option>
                  <option value="Regex">Regex</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input
                type="text"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
              <textarea
                value={form.adminNotes}
                onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={2}
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm text-gray-700">Active</label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
              >
                {editingId ? "Update" : "Add"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keyword</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Match</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ingredients.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{item.keyword}</div>
                  {item.reason && <div className="text-sm text-gray-500">{item.reason}</div>}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${categoryColors[item.category] || "bg-gray-100"}`}>
                    {item.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${severityColors[item.severity] || "bg-gray-100"}`}>
                    {item.severity}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.matchType}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${item.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {ingredients.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No prohibited ingredients found. Add some to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProhibitedIngredientsPage;
