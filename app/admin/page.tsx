"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Plus, FileText, Calendar, Users, ArrowRight, Copy, Check, Pencil } from "lucide-react";

interface FormType {
  id: string;
  title: string;
  description: string;
  createdAt: any;
}

export default function AdminDashboard() {
  const [forms, setForms] = useState<FormType[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/f/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const q = query(collection(db, "forms"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const formsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FormType[];
        setForms(formsData);
      } catch (error) {
        console.error("Error fetching forms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Dashboard
          </h1>
          <p className="text-gray-400">Manage your registration forms and responses</p>
        </div>
        <Link
          href="/admin/form/new"
          className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 font-bold"
        >
          <Plus className="w-5 h-5" />
          Create New Form
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#111] rounded-3xl p-6 shadow-sm border border-white/5 animate-pulse h-48"></div>
          ))}
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-[#111] rounded-3xl p-12 text-center border border-white/5 shadow-sm flex flex-col items-center justify-center">
          <div className="bg-white/5 p-4 rounded-2xl mb-6 border border-white/5">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No forms yet</h3>
          <p className="text-gray-400 mb-8 max-w-sm">
            You haven't created any registration forms yet. Click the button below to get started.
          </p>
          <Link
            href="/admin/form/new"
            className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-xl shadow transition-all font-bold"
          >
            <Plus className="w-5 h-5" />
            Create First Form
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-[#111] rounded-3xl p-6 border border-white/5 hover:border-white/20 transition-all group flex flex-col h-full cursor-default relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <FileText className="w-24 h-24 text-white" />
              </div>
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="bg-white/10 p-3 rounded-2xl border border-white/5">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/form/${form.id}`}
                    className="bg-[#222] hover:bg-[#333] border border-white/10 p-2 rounded-xl text-gray-400 hover:text-white transition-all z-20"
                    title="Edit Form"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={(e) => copyToClipboard(e, form.id)}
                    className="bg-[#222] hover:bg-[#333] border border-white/10 p-2 rounded-xl text-gray-400 hover:text-white transition-all z-20 group/copy"
                    title="Copy Public Link"
                  >
                    {copiedId === form.id ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 relative z-10 pr-2">{form.title}</h3>
              <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-1 relative z-10">{form.description}</p>
              
              <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/10 relative z-10">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                  <Calendar className="w-4 h-4" />
                  {form.createdAt ? new Date(form.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                </div>
                
                <Link
                  href={`/admin/responses/${form.id}`}
                  className="flex items-center gap-1 text-sm font-bold text-white hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  View Responses
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
