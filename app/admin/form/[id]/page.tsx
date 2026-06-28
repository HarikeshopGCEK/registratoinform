"use client";

import { useState, useEffect, use } from "react";
import { v4 as uuidv4 } from "uuid";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, GripVertical, Settings2, LayoutTemplate, CheckSquare, CircleDot, Copy, Check, ArrowRight } from "lucide-react";
import Link from "next/link";

type QuestionType = "text" | "textarea" | "dropdown" | "multiple_choice" | "single_choice";

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  required: boolean;
}

export default function EditForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatedFormId, setUpdatedFormId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const docRef = doc(db, "forms", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.title || "");
          setDescription(data.description || "");
          setQuestions(data.questions || []);
        } else {
          alert("Form not found!");
          router.push("/admin");
        }
      } catch (error) {
        console.error("Error fetching form:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id, router]);

  const addQuestion = (type: QuestionType) => {
    setQuestions([
      ...questions,
      {
        id: uuidv4(),
        text: "",
        type,
        options: ["dropdown", "multiple_choice", "single_choice"].includes(type) ? ["Option 1"] : [],
        required: true,
      },
    ]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSave = async () => {
    if (!title.trim()) return alert("Form title is required");
    if (questions.length === 0) return alert("Add at least one question");

    setSaving(true);
    try {
      const docRef = doc(db, "forms", id);
      await updateDoc(docRef, {
        title,
        description,
        questions,
      });
      setUpdatedFormId(id);
    } catch (error) {
      console.error("Error updating form:", error);
      alert("Failed to update form. Check console.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (updatedFormId) {
      const url = `${window.location.origin}/f/${updatedFormId}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (updatedFormId) {
    return (
      <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-[#111] p-12 rounded-3xl border border-white/10 text-center w-full shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="bg-green-500/20 p-4 rounded-full">
              <Check className="w-12 h-12 text-green-400" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4">Form Updated Successfully!</h2>
          <p className="text-gray-400 mb-8 text-lg">Your changes have been saved and are now live.</p>
          
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 mb-8 flex items-center gap-4">
            <input
              type="text"
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/f/${updatedFormId}`}
              className="bg-transparent text-gray-300 w-full focus:outline-none font-mono text-sm"
            />
            <button
              onClick={handleCopyLink}
              className="bg-white text-black p-3 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/admin"
              className="bg-[#222] hover:bg-[#333] border border-white/10 text-white px-6 py-3 rounded-xl font-bold transition-all"
            >
              Back to Dashboard
            </Link>
            <Link
              href={`/f/${updatedFormId}`}
              target="_blank"
              className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
            >
              Open Form <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto pb-32">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl border border-white/5">
            <LayoutTemplate className="w-6 h-6 text-white" />
          </div>
          Edit Form
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-6 py-2.5 rounded-xl shadow-md font-bold disabled:opacity-50 transition-all"
        >
          {saving ? "Saving..." : "Update Form"}
          <Save className="w-4 h-4" />
        </button>
      </div>

      {/* Form Header */}
      <div className="bg-[#111] rounded-3xl p-8 shadow-sm border border-white/5 mb-8">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Form Title"
          className="w-full text-4xl font-black text-white bg-transparent placeholder-gray-600 focus:outline-none mb-4"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Form Description (Optional)"
          className="w-full text-lg text-gray-400 bg-transparent placeholder-gray-600 focus:outline-none"
        />
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {questions.map((q, index) => (
          <div
            key={q.id}
            className="bg-[#111] rounded-3xl p-6 shadow-sm border border-white/5 relative group transition-all hover:border-white/20"
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-[#222] p-1 rounded cursor-grab shadow-sm border border-white/10 text-gray-400">
              <GripVertical className="w-4 h-4" />
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-4">
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                  placeholder="Question text"
                  className="w-full text-lg font-bold bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-white/30 text-white transition-all"
                />

                {["dropdown", "multiple_choice", "single_choice"].includes(q.type) && (
                  <div className="pl-4 space-y-2 border-l-2 border-white/10">
                    {q.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-white/20 bg-white/5 flex items-center justify-center">
                          {q.type === 'single_choice' && <div className="w-2 h-2 rounded-full bg-white/50" />}
                          {q.type === 'dropdown' && <div className="w-2 h-2 bg-white/50" />}
                        </div>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...q.options];
                            newOpts[i] = e.target.value;
                            updateQuestion(q.id, { options: newOpts });
                          }}
                          className="flex-1 bg-transparent border-b border-dashed border-white/20 px-2 py-1 focus:outline-none focus:border-white/50 text-sm text-white"
                        />
                        <button
                          onClick={() => {
                            const newOpts = q.options.filter((_, idx) => idx !== i);
                            updateQuestion(q.id, { options: newOpts });
                          }}
                          className="text-gray-500 hover:text-red-400"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => updateQuestion(q.id, { options: [...q.options, `Option ${q.options.length + 1}`] })}
                      className="text-sm text-gray-400 hover:text-white font-medium flex items-center gap-1 mt-2"
                    >
                      <Plus className="w-3 h-3" /> Add Option
                    </button>
                  </div>
                )}
              </div>

              <div className="w-48 space-y-4 border-l border-white/10 pl-4">
                <select
                  value={q.type}
                  onChange={(e) => updateQuestion(q.id, { type: e.target.value as QuestionType })}
                  className="w-full bg-[#1a1a1a] border border-white/5 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/30"
                >
                  <option value="text">Short Answer</option>
                  <option value="textarea">Paragraph</option>
                  <option value="dropdown">Dropdown</option>
                  <option value="multiple_choice">Checkboxes</option>
                  <option value="single_choice">Radio Buttons</option>
                </select>

                <div className="flex items-center justify-between pt-2">
                  <label className="text-sm text-gray-400 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                      className="w-4 h-4 bg-[#1a1a1a] border border-white/20 rounded focus:ring-white/30 accent-white"
                    />
                    Required
                  </label>
                  <button
                    onClick={() => removeQuestion(q.id)}
                    className="text-gray-500 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Menu */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#111] rounded-2xl shadow-2xl border border-white/10 p-2 flex gap-1 items-center z-50">
        <button
          onClick={() => addQuestion("text")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 text-gray-300 font-medium text-sm transition-all"
        >
          <Plus className="w-4 h-4 text-white" />
          Text Input
        </button>
        <div className="w-px h-6 bg-white/10 mx-1"></div>
        <button
          onClick={() => addQuestion("dropdown")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 text-gray-300 font-medium text-sm transition-all"
        >
          <Settings2 className="w-4 h-4 text-white" />
          Dropdown
        </button>
        <div className="w-px h-6 bg-white/10 mx-1"></div>
        <button
          onClick={() => addQuestion("multiple_choice")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 text-gray-300 font-medium text-sm transition-all"
        >
          <CheckSquare className="w-4 h-4 text-white" />
          Checkboxes
        </button>
        <div className="w-px h-6 bg-white/10 mx-1"></div>
        <button
          onClick={() => addQuestion("single_choice")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 text-gray-300 font-medium text-sm transition-all"
        >
          <CircleDot className="w-4 h-4 text-white" />
          Radio
        </button>
      </div>
    </div>
  );
}
