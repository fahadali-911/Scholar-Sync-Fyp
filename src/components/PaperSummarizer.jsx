import React, { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle, FileText, Check, Copy, RefreshCw } from "lucide-react";
import { extractTextFromPdfUrl, summarizeResearch } from "../services/aiService";
import { savePostSummary } from "../api/FireStore";

export default function PaperSummarizer({ isOpen, onClose, post }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [copied, setCopied] = useState(false);
  const [stage, setStage] = useState(""); // "", "downloading", "extracting", "summarizing"

  useEffect(() => {
    if (isOpen && post) {
      if (post.aiSummary) {
        setSummary(post.aiSummary);
      } else {
        generateSummary();
      }
    }
  }, [isOpen, post]);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      let sourceText = "";
      
      // If there is an attached PDF file, try to extract text from it
      if (post.fileURL && (post.fileType?.includes("pdf") || post.fileName?.toLowerCase().endsWith(".pdf"))) {
        setStage("downloading");
        try {
          // Attempt text extraction from PDF URL
          const extractedText = await extractTextFromPdfUrl(post.fileURL);
          sourceText = extractedText;
        } catch (extractionError) {
          console.warn("Failed to extract PDF text, falling back to post content:", extractionError);
          // Fallback to description/excerpt if PDF extraction fails
          sourceText = post.description || post.excerpt || post.status || "";
        }
      } else {
        // No PDF attached, summarize description/abstract
        sourceText = post.description || post.excerpt || post.status || "";
      }

      if (!sourceText.trim()) {
        throw new Error("No research content or abstract available to summarize.");
      }

      setStage("summarizing");
      const generatedSummary = await summarizeResearch(sourceText);
      setSummary(generatedSummary);
      
      // Cache generated summary in Firestore
      await savePostSummary(post.id, generatedSummary);
    } catch (err) {
      console.error("AI Summarizer Error:", err);
      setError(err.message || "An unexpected error occurred during summarization.");
    } finally {
      setLoading(false);
      setStage("");
    }
  };

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  // Render format text properly (simple helper to handle simple markdown lines)
  const renderFormattedSummary = (mdText) => {
    if (!mdText) return null;
    return mdText.split("\n").map((line, idx) => {
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-lg font-bold text-slate-800 mt-4 mb-2 flex items-center gap-1.5 border-b pb-1">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("- **")) {
        // Nested bullet bolding format
        const match = line.match(/^-\s+\*\*(.*?)\*\*:(.*)/);
        if (match) {
          return (
            <div key={idx} className="pl-4 mb-2 text-sm text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">• {match[1]}:</span>
              {match[2]}
            </div>
          );
        }
      }
      if (line.startsWith("- ")) {
        return (
          <p key={idx} className="pl-4 mb-2 text-sm text-slate-600 leading-relaxed flex items-start gap-1">
            <span className="text-blue-500 font-bold">•</span>
            <span>{line.replace("- ", "")}</span>
          </p>
        );
      }
      if (line.trim() === "---") {
        return <hr key={idx} className="my-4 border-slate-100" />;
      }
      return (
        <p key={idx} className="text-sm text-slate-600 leading-relaxed mb-2">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-[70] transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 via-purple-50/50 to-indigo-50/20">
          <div className="flex items-center space-x-2.5">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight">
                AI Paper Summarizer
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-[350px] sm:max-w-md">
                {post?.title || post?.status || "Research Paper"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="relative mb-6">
                {/* Custom glowing orbit spinner */}
                <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin"></div>
                <Sparkles className="w-6 h-6 text-purple-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce" />
              </div>
              <h4 className="text-base font-semibold text-slate-700 mb-1">
                {stage === "downloading" && "Downloading PDF Document..."}
                {stage === "summarizing" && "Generating AI Summary..."}
                {!stage && "Running AI NLP Analysis..."}
              </h4>
              <p className="text-sm text-slate-400 max-w-sm">
                This takes a few seconds. Groq is reviewing the text to extract objectives, methods, and key findings.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center my-6">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-rose-800 mb-1">Summarization Failed</h4>
              <p className="text-sm text-rose-600 mb-4">{error}</p>
              <button
                onClick={generateSummary}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>
          )}

          {!loading && !error && summary && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="prose prose-sm max-w-none text-slate-700">
                {renderFormattedSummary(summary)}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              Powered by <span className="font-semibold text-slate-500">Groq</span>
            </span>
            <div className="flex gap-2">
              {summary && (
                <>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-xl text-sm font-medium transition-all"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy Summary
                      </>
                    )}
                  </button>
                  <button
                    onClick={generateSummary}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-xl text-sm font-medium transition-all"
                    title="Regenerate summary"
                  >
                    <RefreshCw className="w-4 h-4" /> Regenerate
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-md transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
