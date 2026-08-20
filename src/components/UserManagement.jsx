import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Lock, Unlock, Key, Trash2, Pencil, Check, X, AlertCircle } from 'lucide-react';

const AVAILABLE_ROLES = [
  { id: 'ADMIN', label: 'Admin' },
  { id: 'USER_MANAGER', label: 'User Manager' },
  { id: 'TEAM_MANAGER', label: 'Team Manager' },
  { id: 'FIXTURE_SECRETARY', label: 'Fixture Secretary' },
  { id: 'CATERER', label: 'Caterer' },
  { id: 'EXTERNAL', label: 'External User' },
];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Form / Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState(['TEAM_MANAGER']);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setFirstName('');
    setLastName('');
    setPassword('');
    setSelectedRoles(['TEAM_MANAGER']);
    setEditingUser(null);
    setFormError(null);
    setShowModal(false);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setUsername(user.username);
    setEmail(user.email || '');
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setPassword(''); // Leave password empty unless updating
    setSelectedRoles(user.roles || []);
    setFormError(null);
    setShowModal(true);
  };

  const toggleRole = (roleId) => {
    setSelectedRoles(prev => {
      if (roleId === 'EXTERNAL') {
        // If toggling EXTERNAL on, remove all other roles; if toggling off, clear roles
        return prev.includes('EXTERNAL') ? [] : ['EXTERNAL'];
      } else {
        // If selecting any non-EXTERNAL role, ensure EXTERNAL is removed
        const withoutExternal = prev.filter(r => r !== 'EXTERNAL');
        return withoutExternal.includes(roleId)
          ? withoutExternal.filter(r => r !== roleId)
          : [...withoutExternal, roleId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (editingUser) {
        // Edit User
        const payload = {
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          roles: selectedRoles,
        };

        const response = await fetch(`/api/users/${editingUser.id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(JSON.stringify(errData) || 'Failed to update user');
        }

        showToast(`User "${editingUser.username}" updated successfully`);
      } else {
        // Create User
        if (!password) {
          setFormError('Password is required when creating a user.');
          setSubmitting(false);
          return;
        }

        const payload = {
          username: username.trim(),
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          password,
          roles: selectedRoles,
        };

        const response = await fetch('/api/users/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = Object.entries(errData)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
          throw new Error(errMsg || 'Failed to create user');
        }

        showToast(`User "${username.trim()}" created successfully`);
      }

      resetForm();
      fetchUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
      showToast(`Account for "${user.username}" ${!user.is_locked ? 'locked' : 'unlocked'}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast('Failed to change lock status', 'error');
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
      showToast(`Password reset flagged for "${user.username}" on next login`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast('Failed to set password reset flag', 'error');
    }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"?`)) return;
    try {
      await fetch(`/api/users/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      showToast(`User "${name}" deleted`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete user', 'error');
    }
  };

  if (loading) return <div className="p-8 text-slate-400">Loading user management...</div>;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-3 ${
          toast.type === 'error'
            ? 'bg-rose-500 text-white shadow-rose-500/20'
            : 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-display text-white">User Management</h2>
          <p className="text-sm text-slate-400">Manage club personnel, roles, permissions, and account access.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/10 text-xs uppercase font-display tracking-wider"
        >
          <UserPlus size={18} />
          <span>Add User</span>
        </button>
      </div>

      {error && <div className="text-red-400 p-4 bg-red-400/10 rounded-lg">{error}</div>}

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Assigned Roles</th>
                <th className="px-6 py-4">Security Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 uppercase font-display">
                        {u.username[0]}
                      </div>
                      <div>
                        <span className="block font-semibold text-white">{u.username}</span>
                        {(u.first_name || u.last_name) && (
                          <span className="text-xs text-slate-400">{u.first_name} {u.last_name}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{u.email || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {u.roles && u.roles.length > 0 ? (
                        u.roles.map((r, i) => (
                          <span key={i} className="px-2.5 py-0.5 rounded-lg text-xxs font-extrabold font-display uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {r.replace('_', ' ')}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic text-xs">No Roles Assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {u.is_locked ? (
                        <span className="flex items-center space-x-1 text-red-400 text-xs font-semibold px-2 py-0.5 bg-red-400/10 border border-red-400/20 rounded-md">
                          <Lock size={12} /> <span>Locked</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-teal-400 text-xs font-semibold px-2 py-0.5 bg-teal-400/10 border border-teal-400/20 rounded-md">
                          <Unlock size={12} /> <span>Active</span>
                        </span>
                      )}
                      
                      {u.force_password_reset && (
                        <span className="flex items-center space-x-1 text-orange-400 text-xs font-semibold px-2 py-0.5 bg-orange-400/10 border border-orange-400/20 rounded-md" title="Must change password on next login">
                          <Key size={12} /> <span>Reset Required</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => openEditModal(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                        title="Edit User"
                      >
                        <Pencil size={15} />
                      </button>
                      <button 
                        onClick={() => toggleLock(u)}
                        className={`p-1.5 rounded-lg transition-colors ${u.is_locked ? 'text-teal-400 hover:bg-teal-400/10' : 'text-red-400 hover:bg-red-400/10'}`}
                        title={u.is_locked ? "Unlock User Account" : "Lock User Account"}
                      >
                        {u.is_locked ? <Unlock size={15} /> : <Lock size={15} />}
                      </button>
                      <button 
                        onClick={() => forceReset(u)}
                        disabled={u.force_password_reset}
                        className={`p-1.5 rounded-lg transition-colors ${u.force_password_reset ? 'text-slate-600 cursor-not-allowed' : 'text-orange-400 hover:bg-orange-400/10'}`}
                        title="Flag Password Reset on Next Login"
                      >
                        <Key size={15} />
                      </button>
                      <button 
                        onClick={() => deleteUser(u.id, u.username)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-400/10 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-lg space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-display">
                {editingUser ? `Edit User (${editingUser.username})` : 'Create New User Account'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. jsmith"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.smith@cricketclub.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Must meet complexity rules"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500"
                  />
                  <p className="text-xxs text-slate-500 mt-1">Min 10 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special symbol.</p>
                </div>
              )}

              {/* Roles Multi-Select Checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assign Roles</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {AVAILABLE_ROLES.map(r => {
                    const isChecked = selectedRoles.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        onClick={() => toggleRole(r.id)}
                        className={`flex items-center space-x-2.5 p-2 rounded-lg cursor-pointer border transition text-xs select-none ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by label click
                          className="rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-emerald-500"
                        />
                        <span className="font-semibold">{r.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
