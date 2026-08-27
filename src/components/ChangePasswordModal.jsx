import React, { useState } from 'react';
import { api } from '../services/api';
import { Lock, X } from 'lucide-react';

export default function ChangePasswordModal({ isOpen, onClose }) {
    const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.new_password !== form.confirm) {
            return setError('New passwords do not match.');
        }

        setLoading(true);
        try {
            await api.changePassword({
                old_password: form.old_password,
                new_password: form.new_password
            });
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setForm({ old_password: '', new_password: '', confirm: '' });
                onClose();
            }, 2000);
        } catch (err) {
            setError(err.message.includes('old_password') ? 'Incorrect current password.' : 'Failed to update password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                            <Lock size={20} />
                        </div>
                        <h2 className="text-lg font-bold font-display text-slate-100">Change Password</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {success ? (
                        <div className="p-4 bg-emerald-950/50 border border-emerald-900/60 rounded-xl text-emerald-400 text-sm font-semibold text-center">
                            Password updated successfully!
                        </div>
                    ) : (
                        <>
                            {error && <div className="p-3 bg-red-950/50 border border-red-900/60 rounded-xl text-red-400 text-xs font-semibold">{error}</div>}

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Current Password</label>
                                <input type="password" required value={form.old_password} onChange={e => setForm({ ...form, old_password: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-blue-500" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">New Password</label>
                                <input type="password" required minLength={8} value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-blue-500" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Confirm New Password</label>
                                <input type="password" required minLength={8} value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-xl p-2.5 outline-none focus:border-blue-500" />
                            </div>

                            <div className="pt-2 flex gap-3">
                                {/* <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition">Cancel</button> */}
                                <button type="button" onClick={onClose} className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-lg shadow-emerald-500/10">Cancel</button>
                                {/* <button type="submit" disabled={loading} className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition"> */}
                                <button type="submit" disabled={loading} className="py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-lg shadow-emerald-500/10">
                                    {loading ? 'Saving...' : 'Update Password'}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}