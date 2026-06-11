import React, { useState } from "react";
import { X, BookOpen, AlertCircle, Check, Copy, ArrowRight, Loader2 } from "lucide-react";
import { getCitationSuggestions } from "../services/aiService";

export default function CitationSuggester({ isOpen, onClose, title, content, onInsertCitations }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [citations, setCitations] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const fetchSuggestions = async () => {
    if (!title && !content) {
      setError("Please write some keywords, a title, or a draft paragraph first to suggest citations.");
      return;
    }

    setLoading(true);
    setError(null);
    setCitations(null);

    try {
      const queryText = `Title: ${title}\nContent draft: ${content}`;
      const results = await getCitationSuggestions(queryText);
      
      // Parse suggestions into structured objects if possible, or keep as text
      // Let's parse the citations to render them as list items with individual actions
      const parsed = parseCitations(results);
      setCitations(parsed);
    } catch (err) {
      console.error("Citation Suggestions Error:", err);
      setError(err.message || "Failed to fetch citation recommendations.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse the markdown citations into individual blocks
  const parseCitations = (mdText) => {
    try {
      const items = [];
      // Split by numbered list pattern
      const sections = mdText.split(/\d+\.\s+\*\*/);
      
      // The first index is the header, skip it
      for (let i = 1; i < sections.length; i++) {
        const section = sections[i];
        
        // Match citation text: Author (Year). *Title*. Journal.
        const titleMatch = section.match(/^(.*?)\*\*/);
        const citation = titleMatch ? titleMatch[1] : "";
        
        // Extract relevance
        const relevanceMatch = section.match(/-\s+\*\*Relevance\*\*:\s*(.*?)(?=\n|$|-\s+\*\*Keywords\*\*)/s);
        const relevance = relevanceMatch ? relevanceMatch[1].trim() : "";
        
        // Extract keywords
        const keywordsMatch = section.match(/-\s+\*\*Keywords\*\*:\s*(.*?)(?=\n|$)/s);
        const keywords = keywordsMatch ? keywordsMatch[1].trim() : "";
        
        items.push({
          raw: `${i}. **${citation}**\n   - **Relevance**: ${relevance}\n\n`,
          citationText: citation.replace(/\*/g, ""), // clean format for insertion
          relevance,
          keywords
        });
      }
      
      if (items.length === 0) {
        // Fallback to raw markdown if parsing fails
        return { isRaw: true, content: mdText };
      }
      
      return { isRaw: false, items };
    } catch (e) {
      console.warn("Failed to parse markdown citation suggestions, returning raw text", e);
      return { isRaw: true, content: mdText };
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleInsert = (citationText) => {
    const formattedReference = `\n\nReferences:\n[1] ${citationText}`;
    onInsertCitations(formattedReference);
    onClose();
  };

  const handleInsertAll = () => {
    if (!citations) return;
    
    let textToInsert = "\n\nReferences:\n";
    if (citations.isRaw) {
      textToInsert += citations.content;
    } else {
      citations.items.forEach((item, idx) => {
        textToInsert += `[${idx + 1}] ${item.citationText}\n`;
      });
    }
    
    onInsertCitations(textToInsert);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-[70] transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50/30">
          <div className="flex items-center space-x-2.5">
            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600 shadow-inner">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight">
                AI Citation Helper
              </h3>
              <p className="text-xs text-slate-500">
                Discover supporting publications for your draft
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
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20">
          {!citations && !loading && !error && (
            <div className="text-center py-10">
              <BookOpen className="w-14 h-14 text-indigo-200 mx-auto mb-4" />
              <h4 className="text-base font-semibold text-slate-700 mb-1">
                Generate Academic References
              </h4>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
                Based on your current title and abstract/content, Groq will search for relevant citation styles and references to enrich your research.
              </p>
              <button
                onClick={fetchSuggestions}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Find Citations
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
              <h4 className="text-sm font-semibold text-slate-700">Searching literature database...</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                Matching keywords to standard academic works and parsing citation details.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center my-4">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-rose-800 mb-1">Request Failed</h4>
              <p className="text-sm text-rose-600 mb-4">{error}</p>
              <button
                onClick={fetchSuggestions}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && citations && (
            <div className="space-y-4">
              {citations.isRaw ? (
                <div className="bg-white rounded-xl border p-4 text-sm text-slate-700 whitespace-pre-wrap">
                  {citations.content}
                </div>
              ) : (
                citations.items.map((item, index) => (
                  <div key={index} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm space-y-3">
                    <p className="text-sm font-semibold text-slate-800 leading-snug">
                      {index + 1}. {item.citationText}
                    </p>
                    {item.relevance && (
                      <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600">
                        <span className="font-semibold text-indigo-600">Relevance: </span>
                        {item.relevance}
                      </div>
                    )}
                    {item.keywords && (
                      <div className="flex flex-wrap gap-1 text-xs text-slate-400">
                        <span>Tags: {item.keywords}</span>
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-1 border-t border-slate-100/50">
                      <button
                        onClick={() => handleCopy(item.citationText, index)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 border rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-500" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleInsert(item.citationText)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 border border-indigo-100 rounded-lg bg-indigo-50/50 hover:bg-indigo-50 transition-colors"
                      >
                        Insert Reference <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && citations && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <button
              onClick={fetchSuggestions}
              className="px-4 py-2 border rounded-xl text-sm font-medium hover:bg-slate-100 text-slate-600 transition-colors"
            >
              Refresh Search
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleInsertAll}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-colors"
              >
                Insert All References
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-xl text-sm font-medium hover:bg-slate-100 text-slate-600 transition-colors"
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
