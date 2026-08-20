import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import {
  Users, Plus, Pencil, Trash2, Check, X,
  AlertTriangle, Shield, Globe, Ruler, UserCheck
} from 'lucide-react';

export default function TeamsManager({ teams, pitchLengths, onTeamsChanged }) {
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toast, setToast] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableUsers(data);
      }
    } catch (e) {
      console.warn('Could not fetch users for manager selection', e);
    }
  };

  // Form state
  const [formName, setFormName] = useState('');
  const [formLengthId, setFormLengthId] = useState('');
  const [formIsExternal, setFormIsExternal] = useState(false);
  const [formManagers, setFormManagers] = useState([]);

  const clubTeams = useMemo(() => teams.filter(t => !t.is_external), [teams]);
  const externalTeams = useMemo(() => teams.filter(t => t.is_external), [teams]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const resetForm = () => {
    setFormName('');
    setFormLengthId('');
    setFormIsExternal(false);
    setFormManagers([]);
    setEditingTeam(null);
    setShowForm(false);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (team) => {
    setFormName(team.name);
    setFormLengthId(team.required_length ? String(team.required_length) : '');
    setFormIsExternal(team.is_external);
    setFormManagers(team.managers || []);
    setEditingTeam(team);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        required_length: formLengthId ? parseInt(formLengthId, 10) : null,
        is_external: formIsExternal,
        managers: formManagers,
      };

      if (editingTeam) {
        await api.updateTeam(editingTeam.id, payload);
        showToast(`"${payload.name}" updated successfully`);
      } else {
        await api.createTeam(payload);
        showToast(`"${payload.name}" added successfully`);
      }

      resetForm();
      onTeamsChanged();
    } catch (err) {
      console.error('Failed to save team:', err);
      showToast('Failed to save team. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (team) => {
    setSaving(true);
    try {
      await api.deleteTeam(team.id);
      showToast(`"${team.name}" deleted`);
      setDeleteConfirmId(null);
      onTeamsChanged();
    } catch (err) {
      console.error('Failed to delete team:', err);
      showToast('Failed to delete team. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getLengthLabel = (lengthId) => {
    const pl = pitchLengths.find(l => l.id === lengthId);
    return pl ? `${pl.length_yards} yds` : '—';
  };

  const getLengthDescription = (lengthId) => {
    const pl = pitchLengths.find(l => l.id === lengthId);
    return pl ? pl.description : '';
  };

  const renderTeamRow = (team) => {
    const isDeleting = deleteConfirmId === team.id;

    return (
      <tr
        key={team.id}
        className="group border-b border-slate-800/60 last:border-b-0 transition-colors hover:bg-slate-800/30"
      >
        <td className="py-3.5 px-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-display
              ${team.is_external
                ? 'bg-amber-950/50 text-amber-400 border border-amber-900/40'
                : 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40'
              }`}
            >
              {team.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="font-semibold text-slate-100 text-sm">{team.name}</span>
            </div>
          </div>
        </td>
        <td className="py-3.5 px-4">
          {team.required_length ? (
            <div className="flex items-center gap-1.5">
              <Ruler size={12} className="text-slate-500" />
              <span className="text-sm text-slate-300">{getLengthLabel(team.required_length)}</span>
              <span className="text-xs text-slate-500 hidden sm:inline">({getLengthDescription(team.required_length)})</span>
            </div>
          ) : (
            <span className="text-xs text-slate-600">Not set</span>
          )}
        </td>
        <td className="py-3.5 px-4">
          {team.is_external ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-950/50 text-amber-400 border border-amber-900/40">
              <Globe size={10} />
              External
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-900/40">
              <Shield size={10} />
              Club
            </span>
          )}
        </td>
        <td className="py-3.5 px-4 text-right">
          {isDeleting ? (
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-red-400 mr-1">Delete?</span>
              <button
                onClick={() => handleDelete(team)}
                disabled={saving}
                className="p-1.5 rounded-lg bg-red-950/60 text-red-400 hover:bg-red-900/60 border border-red-900/40 transition disabled:opacity-50"
                title="Confirm delete"
              >
                <Check size={13} />
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700/60 transition"
                title="Cancel"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEditForm(team)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 border border-transparent hover:border-slate-700/60 transition"
                title="Edit team"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => setDeleteConfirmId(team.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 border border-transparent hover:border-slate-700/60 transition"
                title="Delete team"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-slate-100 flex items-center gap-2.5">
            <Users size={22} className="text-emerald-400" />
            Manage Teams
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {teams.length} team{teams.length !== 1 ? 's' : ''} registered
            <span className="mx-1.5 text-slate-700">·</span>
            {clubTeams.length} club
            <span className="mx-1.5 text-slate-700">·</span>
            {externalTeams.length} external
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-semibold font-display text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-[0.97]"
        >
          <Plus size={16} />
          Add Team
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
          toast.type === 'error'
            ? 'bg-red-950/60 text-red-300 border-red-900/40'
            : 'bg-emerald-950/60 text-emerald-300 border-emerald-900/40'
        }`}>
          {toast.type === 'error' ? <AlertTriangle size={15} /> : <Check size={15} />}
          {toast.message}
        </div>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="glass-panel rounded-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <h3 className="text-sm font-bold font-display uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
            {editingTeam ? (
              <><Pencil size={14} className="text-emerald-400" /> Edit Team</>
            ) : (
              <><Plus size={14} className="text-emerald-400" /> New Team</>
            )}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            {/* Team Name */}
            <div className="sm:col-span-4">
              <label htmlFor="team-name" className="block text-xs font-medium text-slate-400 mb-1.5">
                Team Name <span className="text-red-400">*</span>
              </label>
              <input
                id="team-name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                placeholder="e.g. 3rd XI or Dorset Ladies"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/60 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition"
              />
            </div>

            {/* Required Pitch Length */}
            <div className="sm:col-span-3">
              <label htmlFor="team-length" className="block text-xs font-medium text-slate-400 mb-1.5">
                Required Pitch Length
              </label>
              <select
                id="team-length"
                value={formLengthId}
                onChange={(e) => setFormLengthId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/60 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition appearance-none"
              >
                <option value="">— None —</option>
                {pitchLengths.map(pl => (
                  <option key={pl.id} value={pl.id}>
                    {pl.length_yards} yds — {pl.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Is External Toggle */}
            <div className="sm:col-span-2 flex items-center gap-3 pb-0.5">
              <button
                type="button"
                role="switch"
                aria-checked={formIsExternal}
                onClick={() => setFormIsExternal(!formIsExternal)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                  formIsExternal ? 'bg-amber-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
                    formIsExternal ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <label className="text-sm text-slate-300 select-none cursor-pointer" onClick={() => setFormIsExternal(!formIsExternal)}>
                External Team
              </label>
            </div>

            {/* Assigned Managers */}
            <div className="sm:col-span-12 pt-2 border-t border-slate-800">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Assigned Team Managers
              </label>
              <div className="flex flex-wrap gap-2">
                {availableUsers
                  .filter(u => u.roles?.includes('TEAM_MANAGER') || u.roles?.includes('ADMIN'))
                  .map(u => {
                    const isSelected = formManagers.includes(u.id);
                    return (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => {
                          setFormManagers(prev =>
                            isSelected ? prev.filter(id => id !== u.id) : [...prev, u.id]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <UserCheck size={13} />
                        <span>{u.username} ({u.first_name} {u.last_name})</span>
                      </button>
                    );
                  })}
                {availableUsers.filter(u => u.roles?.includes('TEAM_MANAGER') || u.roles?.includes('ADMIN')).length === 0 && (
                  <span className="text-xs text-slate-500 italic">No users with Team Manager role found. Create them in User Management.</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sm:col-span-2 flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-sm font-medium border border-slate-700/60 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !formName.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/15"
              >
                {saving ? '...' : editingTeam ? 'Save' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teams Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <Users className="text-slate-700" size={40} />
            <p className="text-sm text-slate-500 font-display font-medium">No teams registered yet</p>
            <button
              onClick={openAddForm}
              className="text-sm text-emerald-400 hover:text-emerald-300 transition font-medium"
            >
              + Add your first team
            </button>
          </div>
        ) : (
          <>
            {/* Club Teams Section */}
            {clubTeams.length > 0 && (
              <div>
                <div className="px-4 py-2.5 bg-slate-900/50 border-b border-slate-800/60">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                    <Shield size={11} />
                    Club Teams ({clubTeams.length})
                  </h4>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800/60">
                      <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 py-2.5 px-4">Name</th>
                      <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 py-2.5 px-4">Pitch Length</th>
                      <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 py-2.5 px-4">Type</th>
                      <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 py-2.5 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubTeams.map(renderTeamRow)}
                  </tbody>
                </table>
              </div>
            )}

            {/* External Teams Section */}
            {externalTeams.length > 0 && (
              <div className={clubTeams.length > 0 ? 'border-t border-slate-800/40' : ''}>
                <div className="px-4 py-2.5 bg-slate-900/50 border-b border-slate-800/60">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                    <Globe size={11} />
                    External Teams ({externalTeams.length})
                  </h4>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800/60">
                      <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 py-2.5 px-4">Name</th>
                      <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 py-2.5 px-4">Pitch Length</th>
                      <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 py-2.5 px-4">Type</th>
                      <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 py-2.5 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {externalTeams.map(renderTeamRow)}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
