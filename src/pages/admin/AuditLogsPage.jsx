/**
 * AuditLogsPage.jsx
 * Layer: Admin
 *
 * Displays a paginated, read-only table of all admin audit log entries from
 * GET /api/admin/audit-logs?skip=&take=. Each row shows timestamp, admin
 * username, IP address, action type (colour-coded), affected entity, a
 * truncated description with an expandable diff (old/new JSON), and a
 * success/failure status badge.
 *
 * Pagination is cursor-free (skip/take). Page size is fixed at 50 rows.
 * "Previous" is disabled on page 0; "Next" is disabled when the current
 * page returned fewer rows than the page size.
 *
 * Access: JWT-authenticated admin users only.
 */
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../utils/api";

/**
 * @returns {JSX.Element}
 */
const AuditLogsPage = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  // Number of rows fetched per request — also used to detect whether there is a next page
  const pageSize = 50;

  const authHeader = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const fetchLogs = async (pageNum) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/audit-logs?skip=${pageNum * pageSize}&take=${pageSize}`,
        { headers: authHeader }
      );
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      const data = await res.json();
      setLogs(data);
      // If the API returned a full page, assume another page exists
      setHasMore(data.length === pageSize);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchLogs(page);
  }, [token, page]);

  // Colour map for the action-type badge in each log row
  const actionColors = {
    Create: "bg-green-100 text-green-800",
    Update: "bg-blue-100 text-blue-800",
    Delete: "bg-red-100 text-red-800",
    View: "bg-gray-100 text-gray-800",
    PromoteUser: "bg-purple-100 text-purple-800",
    DemoteUser: "bg-orange-100 text-orange-800",
    Login: "bg-cyan-100 text-cyan-800",
    SystemAction: "bg-yellow-100 text-yellow-800",
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
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600 mt-1">View all admin actions and system events</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{log.adminUsername}</div>
                  <div className="text-xs text-gray-500">{log.ipAddress}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${actionColors[log.action] || "bg-gray-100"}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div>{log.entityType}</div>
                  {log.entityId && (
                    <div className="text-xs text-gray-400 truncate max-w-[150px]" title={log.entityId}>
                      {log.entityId}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-[300px] truncate" title={log.description}>
                    {log.description}
                  </div>
                  {log.oldValues && (
                    // Collapsible diff: red = old values, green = new values (stored as JSON strings)
                    <details className="text-xs text-gray-500 mt-1">
                      <summary className="cursor-pointer hover:text-gray-700">View Changes</summary>
                      <div className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                        <div className="text-red-600">- {JSON.stringify(JSON.parse(log.oldValues || "{}"), null, 2)}</div>
                        <div className="text-green-600">+ {JSON.stringify(JSON.parse(log.newValues || "{}"), null, 2)}</div>
                      </div>
                    </details>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${log.wasSuccessful ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {log.wasSuccessful ? "Success" : "Failed"}
                  </span>
                  {log.errorMessage && (
                    <div className="text-xs text-red-500 mt-1">{log.errorMessage}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No audit logs found.
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page + 1}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
