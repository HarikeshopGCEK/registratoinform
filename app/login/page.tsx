"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.push("/admin");
    }
  }, [loading, user, isAdmin, router]);

  if (!loading && user && isAdmin) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin");
    } catch (err: any) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 selection:bg-purple-900 selection:text-white">
      <div className="relative z-10 w-full max-w-md">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 blur-3xl -z-10 rounded-full" />
        <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl shadow-2xl w-full transform transition-all">
          <div className="flex justify-center mb-8">
            <div className="bg-white/5 p-4 rounded-2xl shadow-inner border border-white/5">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white text-center mb-2 tracking-tight">
            Admin Portal
          </h2>
          <p className="text-gray-400 text-center mb-8 text-sm">
            Sign in to manage your registration forms
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/30 focus:bg-white/10 transition-all"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/30 focus:bg-white/10 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-white hover:bg-gray-200 text-black font-bold rounded-xl shadow-lg transform transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 mt-4"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
