import * as pdfjsLib from "pdfjs-dist";

// Initialize Groq API key from environment variables (checking both spellings)
const apiKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_API_KEY;

// Set up PDF.js worker using CDN to avoid bundler/Vite path issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

/**
 * Extracts text from a PDF file URL.
 * It fetches the PDF, reads the first 10 pages, and extracts the text contents.
 * @param {string} pdfUrl - The public URL of the PDF document
 * @returns {Promise<string>} - Extracted text content
 */
export const extractTextFromPdfUrl = async (pdfUrl) => {
  try {
    console.log("📥 Fetching PDF file from URL:", pdfUrl);
    
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF file: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    console.log(`📄 PDF loaded successfully. Total pages: ${pdf.numPages}`);
    
    let fullText = "";
    const pagesToRead = Math.min(pdf.numPages, 10);
    
    for (let pageNum = 1; pageNum <= pagesToRead; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n";
      } catch (pageError) {
        console.warn(`Error reading page ${pageNum}:`, pageError);
      }
    }
    
    if (!fullText.trim()) {
      throw new Error("No readable text found in PDF document (it might be scanned or image-only).");
    }
    
    return fullText;
  } catch (error) {
    console.error("❌ PDF text extraction failed:", error);
    throw error;
  }
};

/**
 * Call the Groq chat completions API.
 * @param {string} systemPrompt - Instruction context
 * @param {string} userPrompt - Main text input
 * @returns {Promise<string>} - Model text response
 */
const callAI = async (systemPrompt, userPrompt) => {
  if (!apiKey || apiKey === "YOUR_GROK_API_KEY_HERE" || apiKey.trim() === "") {
    throw new Error(
      "Groq API key is not configured. Please add VITE_GROK_API_KEY or VITE_GROQ_API_KEY to your .env file."
    );
  }

  console.log("⚡ Executing request: Using Groq API...");
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: "llama-3.3-70b-versatile", // standard high-quality text model on Groq
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("❌ Groq API execution failed:", error);
    throw new Error(`Groq API Error: ${error.message}`);
  }
};

/**
 * Automatically generates a structured summary of a research paper's text.
 * @param {string} text - The extracted text of the paper or its abstract
 * @returns {Promise<string>} - The generated summary in markdown format
 */
export const summarizeResearch = async (text) => {
  const systemPrompt = `You are an expert academic research assistant. Your task is to analyze the following research paper text and generate a structured, highly professional summary.
Your summary must follow this exact markdown template:

### 📌 Research Overview
[Provide a clear, high-level summary of the paper in 3-4 sentences]

### 🎯 Key Objectives
- [Objective 1]
- [Objective 2]

### 🧪 Methodology
- [Describe research methods, data collection, or system architecture used in the paper]

### 📈 Major Findings & Insights
- **[Key Finding 1]**: [Details...]
- **[Key Finding 2]**: [Details...]

### 💡 Academic Contribution
[Explain how this research advances the field or what novelty it brings]`;

  const userPrompt = `Here is the text to summarize:\n${text.substring(0, 25000)}`;
  return callAI(systemPrompt, userPrompt);
};

/**
 * Suggests academic citations based on keywords or text draft.
 * @param {string} keywordsOrDraft - Context keywords or text draft
 * @returns {Promise<string>} - Suggested citations in markdown format
 */
export const getCitationSuggestions = async (keywordsOrDraft) => {
  const systemPrompt = `You are an academic writing and reference assistant. Based on the following keywords or draft text, suggest 3-5 relevant academic publications, books, or papers.
Provide standard citation formats (APA style) and explain why each is relevant to the topic.

Your output must use this markdown structure:

### 📚 Recommended Citations

1. **[Author Name(s)] ([Year]). *[Paper/Book Title]*. [Journal/Publisher].**
   - **Relevance**: [1-2 sentences explaining why the author should cite this work based on their draft]
   - **Keywords**: [Related tags]

2. **[Author Name(s)] ([Year]). *[Paper/Book Title]*. [Journal/Publisher].**
   - **Relevance**: [Explanation...]
   - **Keywords**: [Tags...]

*Tip: You can search these papers on Google Scholar or ResearchGate to retrieve full text access.*`;

  const userPrompt = `Here is the writing draft or keywords:\n${keywordsOrDraft}`;
  return callAI(systemPrompt, userPrompt);
};
