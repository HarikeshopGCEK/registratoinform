"use client";

import { useState, useEffect, use } from "react";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Send, CheckCircle, Star } from "lucide-react";

interface Question {
  id: string;
  text: string;
  type: "text" | "textarea" | "dropdown" | "multiple_choice" | "single_choice" | "date" | "time" | "rating";
  options: string[];
  required: boolean;
}

interface FormType {
  title: string;
  description: string;
  successMessage?: string;
  isActive?: boolean;
  expiresAt?: string;
  questions: Question[];
}

export default function PublicForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [form, setForm] = useState<FormType | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const savedDraft = localStorage.getItem(`draft_${id}`);
    if (savedDraft) {
      try {
        setAnswers(JSON.parse(savedDraft));
      } catch (e) {
        console.error("Failed to parse draft");
      }
    }
  }, [id]);

  useEffect(() => {
    if (Object.keys(answers).length > 0 && !submitted) {
      localStorage.setItem(`draft_${id}`, JSON.stringify(answers));
    }
  }, [answers, id, submitted]);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const docRef = doc(db, "forms", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setForm(docSnap.data() as FormType);
        } else {
          setForm(null); // Not found
        }
      } catch (error) {
        console.error("Error fetching form:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      await addDoc(collection(db, "responses"), {
        formId: id,
        answers,
        submittedAt: serverTimestamp(),
      });
      localStorage.removeItem(`draft_${id}`);
      setSubmitted(true);
    } catch (error: any) {
      console.error("Error submitting form:", error);
      setSubmitError(error.message || "Failed to submit form.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-[#111] p-8 rounded-3xl border border-white/5 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-white mb-2">Form Not Found</h2>
          <p className="text-gray-400">The form you are looking for does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  if (form) {
    if (form.isActive === false) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-[#111] p-8 rounded-3xl border border-white/5 text-center max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-2">Form Closed</h2>
            <p className="text-gray-400">This form is no longer accepting responses.</p>
          </div>
        </div>
      );
    }
    
    if (form.expiresAt && new Date(form.expiresAt) < new Date()) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-[#111] p-8 rounded-3xl border border-white/5 text-center max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-2">Form Expired</h2>
            <p className="text-gray-400">This form has expired and is no longer accepting responses.</p>
          </div>
        </div>
      );
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-[#111] p-12 rounded-3xl border border-white/5 text-center max-w-lg w-full transform transition-all">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-20 h-20 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Thank You!</h2>
          <p className="text-gray-400 text-lg">{form?.successMessage || "Your response has been successfully recorded."}</p>
        </div>
      </div>
    );
  }

  const totalQuestions = form.questions.length;
  const answeredQuestions = form.questions.filter(q => {
    const val = answers[q.id];
    if (Array.isArray(val)) return val.length > 0;
    return val !== undefined && val !== "";
  }).length;
  const progressPercentage = totalQuestions === 0 ? 0 : Math.round((answeredQuestions / totalQuestions) * 100);

  return (
    <div className="min-h-screen bg-black py-12 px-4 selection:bg-white/20 selection:text-white">
      {/* Sticky Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-white/10 z-50">
        <div 
          className="h-full bg-white transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="max-w-3xl mx-auto space-y-6 pt-4">
        {/* Form Header */}
        <div className="bg-[#111] rounded-3xl p-10 border border-white/5">
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">{form.title}</h1>
          {form.description && (
            <p className="text-lg text-gray-400 pt-4 mt-2 border-t border-white/5">
              {form.description}
            </p>
          )}
        </div>

        {submitError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-center">
            {submitError}
          </div>
        )}

        {/* Questions */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {form.questions.map((q) => (
            <div key={q.id} className="bg-[#111] rounded-3xl p-8 border border-white/5 hover:border-white/10 transition-all">
              <label className="block text-xl font-bold text-white mb-6">
                {q.text} {q.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {q.type === "text" && (
                <input
                  type="text"
                  required={q.required}
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className="w-full bg-[#1a1a1a] border-b-2 border-white/10 px-4 py-3 focus:outline-none focus:border-white focus:bg-[#222] transition-colors text-white text-lg rounded-t-xl"
                  placeholder="Your answer"
                />
              )}

              {q.type === "textarea" && (
                <textarea
                  required={q.required}
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  rows={4}
                  className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all text-white text-lg resize-y"
                  placeholder="Your answer"
                />
              )}

              {q.type === "dropdown" && (
                <div className="relative">
                  <select
                    required={q.required}
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="w-full appearance-none bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all text-white text-lg cursor-pointer"
                  >
                    <option value="" disabled>Choose an option</option>
                    {q.options.map((opt, i) => (
                      <option key={i} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              )}

              {q.type === "single_choice" && (
                <div className="space-y-3">
                  {q.options.map((opt, i) => (
                    <label key={i} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name={`radio_${q.id}`}
                        required={q.required}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        className="w-5 h-5 bg-[#1a1a1a] border-white/20 focus:ring-white/30 accent-white cursor-pointer"
                      />
                      <span className="text-gray-300 text-lg group-hover:text-white transition-colors">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === "multiple_choice" && (
                <div className="space-y-3">
                  {q.options.map((opt, i) => {
                    const currentAnswers: string[] = answers[q.id] || [];
                    const isChecked = currentAnswers.includes(opt);
                    return (
                      <label key={i} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          value={opt}
                          checked={isChecked}
                          onChange={(e) => {
                            let newAnswers = [...currentAnswers];
                            if (e.target.checked) {
                              newAnswers.push(opt);
                            } else {
                              newAnswers = newAnswers.filter(a => a !== opt);
                            }
                            setAnswers({ ...answers, [q.id]: newAnswers });
                          }}
                          className="w-5 h-5 bg-[#1a1a1a] border-white/20 rounded focus:ring-white/30 accent-white cursor-pointer"
                        />
                        <span className="text-gray-300 text-lg group-hover:text-white transition-colors">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {q.type === "date" && (
                <input
                  type="date"
                  required={q.required}
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className="w-full bg-[#1a1a1a] border-b-2 border-white/10 px-4 py-3 focus:outline-none focus:border-white focus:bg-[#222] transition-colors text-white text-lg rounded-t-xl"
                  style={{ colorScheme: 'dark' }}
                />
              )}

              {q.type === "time" && (
                <input
                  type="time"
                  required={q.required}
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className="w-full bg-[#1a1a1a] border-b-2 border-white/10 px-4 py-3 focus:outline-none focus:border-white focus:bg-[#222] transition-colors text-white text-lg rounded-t-xl"
                  style={{ colorScheme: 'dark' }}
                />
              )}

              {q.type === "rating" && (
                <div className="flex gap-2 justify-center py-4">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [q.id]: rating })}
                      className={`p-4 rounded-2xl transition-all flex items-center justify-center border ${answers[q.id] === rating ? 'bg-white text-black border-white scale-110 shadow-lg shadow-white/10' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#222] hover:text-white border-white/5'}`}
                    >
                      <Star className={`w-8 h-8 ${answers[q.id] === rating ? 'fill-black' : ''}`} />
                    </button>
                  ))}
                  {q.required && !answers[q.id] && (
                    <input type="number" required className="opacity-0 absolute w-0 h-0" />
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-8 py-4 rounded-xl shadow-lg font-bold text-lg disabled:opacity-50 transform hover:-translate-y-0.5 transition-all"
            >
              {submitting ? "Submitting..." : "Submit"}
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
