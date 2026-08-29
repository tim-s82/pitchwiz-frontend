import React, { useState } from "react";
import { Lock, Mail, KeyRound, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "../services/api";
const API_BASE_URL = import.meta.env.VITE_API_URL;

export function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        throw new Error("Invalid username or password");
      }
      const data = await response.json();
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      onLoginSuccess(data.access);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px] mix-blend-screen animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[128px] mix-blend-screen animate-pulse pointer-events-none delay-700"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-8 transform transition-all hover:scale-[1.01] duration-500">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 mb-4 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
              <span className="font-bold font-display text-3xl text-slate-950 tracking-tighter">
                PW
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white font-display tracking-tight">
              Welcome to PitchWiz
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Sign in to manage your club's pitches.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start space-x-3 animate-in slide-in-from-top-2 fade-in">
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-300 leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-inner"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-inner"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function ForcePasswordResetScreen({ onResetSuccess, onCancel }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/change_password/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword,
          }),
        },
      );
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.old_password?.[0] ||
            errData.new_password?.[0] ||
            "Failed to update password",
        );
      }
      onResetSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-rose-900/50 rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20 mb-4">
              <KeyRound className="text-slate-950" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white font-display tracking-tight">
              Password Reset Required
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Your password has expired or an administrator has requested a
              reset.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start space-x-3">
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-300 leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all shadow-inner"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all shadow-inner"
              />
              <p className="text-xs text-slate-500 pl-1">
                Must contain 1 uppercase, 1 lowercase, 1 number, and 1 special
                character.
              </p>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all"
              >
                Logout
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 px-4 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
              >
                {loading ? "Updating..." : "Update"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
