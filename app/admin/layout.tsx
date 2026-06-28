"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { LogOut, FileText, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black flex text-white selection:bg-purple-900 selection:text-white">
        {/* Sidebar */}
        <aside className="w-64 bg-[#0a0a0a] border-r border-white/10 hidden md:block">
          <div className="h-full flex flex-col">
            <div className="p-6">
              <h2 className="text-2xl font-bold tracking-tighter flex items-center gap-2">
                <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                FormAdmin
              </h2>
            </div>
            
            <nav className="flex-1 px-4 space-y-2 mt-4">
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  pathname === "/admin"
                    ? "bg-white/10 text-white font-medium"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
              <Link
                href="/admin/form/new"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  pathname.startsWith("/admin/form")
                    ? "bg-white/10 text-white font-medium"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                }`}
              >
                <FileText className="w-5 h-5" />
                Forms
              </Link>
            </nav>

            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => signOut(auth)}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-medium"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-black">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
