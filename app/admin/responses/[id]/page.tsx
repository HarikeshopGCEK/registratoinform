"use client";

import { useState, useEffect, use } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as XLSX from "xlsx";
import { Download, Users, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Question {
  id: string;
  text: string;
  type: string;
}

interface FormType {
  title: string;
  questions: Question[];
}

interface ResponseType {
  id: string;
  answers: Record<string, any>;
  submittedAt: any;
}

export default function ResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [form, setForm] = useState<FormType | null>(null);
  const [responses, setResponses] = useState<ResponseType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Form
        const formDoc = await getDoc(doc(db, "forms", id));
        if (formDoc.exists()) {
          setForm(formDoc.data() as FormType);
        } else {
          setForm(null);
          setLoading(false);
          return;
        }

        // Fetch Responses
        const q = query(
          collection(db, "responses"),
          where("formId", "==", id)
        );
        const snapshot = await getDocs(q);
        let resData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ResponseType[];
        
        // Sort in memory to avoid requiring a composite index in Firestore
        resData.sort((a, b) => {
          const timeA = a.submittedAt ? a.submittedAt.seconds : 0;
          const timeB = b.submittedAt ? b.submittedAt.seconds : 0;
          return timeB - timeA; // Descending
        });

        setResponses(resData);
      } catch (error) {
        console.error("Error fetching responses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const exportToExcel = () => {
    if (!form || responses.length === 0) return;

    // Create Headers
    const headers = ["Submitted At", ...form.questions.map((q) => q.text)];
    
    // Create Data Rows
    const data = responses.map((res) => {
      const row: any = {
        "Submitted At": res.submittedAt ? new Date(res.submittedAt.seconds * 1000).toLocaleString() : "Unknown",
      };
      form.questions.forEach((q) => {
        const ans = res.answers[q.id];
        row[q.text] = Array.isArray(ans) ? ans.join(", ") : (ans || "");
      });
      return row;
    });

    // Generate Excel File
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");
    
    XLSX.writeFile(workbook, `${form.title}_responses.xlsx`);
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-white">Form Not Found</h2>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/admin" className="text-gray-400 hover:text-white flex items-center gap-2 font-medium w-fit transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            {form.title} - Responses
          </h1>
          <div className="flex items-center gap-4 text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {responses.length} total responses
            </span>
            <span className="text-gray-700">|</span>
            <Link href={`/f/${id}`} target="_blank" className="flex items-center gap-1 text-gray-400 hover:text-white hover:underline transition-colors">
              View Public Form <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
        
        <button
          onClick={exportToExcel}
          disabled={responses.length === 0}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-xl shadow-md disabled:opacity-50 transition-all font-bold"
        >
          <Download className="w-4 h-4" />
          Export to Excel
        </button>
      </div>

      {responses.length === 0 ? (
        <div className="bg-[#111] rounded-3xl p-12 text-center border border-white/5 shadow-sm">
          <p className="text-gray-400 text-lg">No responses collected yet.</p>
        </div>
      ) : (
        <div className="bg-[#111] rounded-3xl shadow-sm border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="p-4 font-bold text-gray-300 whitespace-nowrap">Submitted At</th>
                  {form.questions.map((q) => (
                    <th key={q.id} className="p-4 font-bold text-gray-300 min-w-[200px]">
                      {q.text}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {responses.map((res) => (
                  <tr key={res.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-gray-500 text-sm whitespace-nowrap">
                      {res.submittedAt ? new Date(res.submittedAt.seconds * 1000).toLocaleString() : "Unknown"}
                    </td>
                    {form.questions.map((q) => {
                      const ans = res.answers[q.id];
                      const displayAns = Array.isArray(ans) ? ans.join(", ") : ans;
                      return (
                        <td key={q.id} className="p-4 text-gray-200">
                          {displayAns || <span className="text-gray-600 italic">Empty</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
