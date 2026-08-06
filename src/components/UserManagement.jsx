import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Lock, Unlock, Key, MoreVertical, Trash2 } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleLock = async (user) => {
    try {
      await fetch(`/api/users/${user.id}/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ is_locked: !user.is_locked })
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const forceReset = async (user) => {
    try {
      await fetch(`/api/users/${user.id}/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ force_password_reset: true })
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await fetch(`/api/users/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-slate-400">Loading user management...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-display text-white">User Management</h2>
          <p className="text-sm text-slate-400">Manage club personnel, roles, and access.</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors">
          <UserPlus size={18} />
          <span>Add User</span>
        </button>
      </div>

      {error && <div className="text-red-400 p-4 bg-red-400/10 rounded-lg">{error}</div>}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Roles</th>
                <th className="px-6 py-4">Security Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-emerald-500 uppercase">
                        {u.username[0]}
                      </div>
                      <span>{u.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{u.first_name} {u.last_name}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {u.roles && u.roles.length > 0 ? (
                        u.roles.map((r, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {r.replace('_', ' ')}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic text-xs">No Roles</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {u.is_locked ? (
                        <span className="flex items-center space-x-1 text-red-400 text-xs font-semibold px-2 py-1 bg-red-400/10 rounded-md">
                          <Lock size={12} /> <span>Locked</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-teal-400 text-xs font-semibold px-2 py-1 bg-teal-400/10 rounded-md">
                          <Unlock size={12} /> <span>Active</span>
                        </span>
                      )}
                      
                      {u.force_password_reset && (
                        <span className="flex items-center space-x-1 text-orange-400 text-xs font-semibold px-2 py-1 bg-orange-400/10 rounded-md" title="Reset forced on next login">
                          <Key size={12} /> <span>Must Reset</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-3">
                      <button 
                        onClick={() => toggleLock(u)}
                        className={`p-1.5 rounded-lg transition-colors ${u.is_locked ? 'text-teal-400 hover:bg-teal-400/10' : 'text-red-400 hover:bg-red-400/10'}`}
                        title={u.is_locked ? "Unlock User" : "Lock User"}
                      >
                        {u.is_locked ? <Unlock size={16} /> : <Lock size={16} />}
                      </button>
                      <button 
                        onClick={() => forceReset(u)}
                        disabled={u.force_password_reset}
                        className={`p-1.5 rounded-lg transition-colors ${u.force_password_reset ? 'text-slate-600 cursor-not-allowed' : 'text-orange-400 hover:bg-orange-400/10'}`}
                        title="Force Password Reset"
                      >
                        <Key size={16} />
                      </button>
                      <button 
                        onClick={() => deleteUser(u.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-400/10 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
