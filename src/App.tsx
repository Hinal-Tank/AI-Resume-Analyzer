import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  Briefcase,
  HelpCircle,
  History,
  User,
  Mail,
  Phone,
  Award,
  AlertTriangle,
  TrendingUp,
  Check,
  Plus,
  Trash2,
  Download,
  ExternalLink,
  X,
  RefreshCw,
  Sliders,
  ChevronRight,
  Sparkles,
  Printer,
  Search,
  BookOpen,
  Send,
  CheckSquare
} from "lucide-react";
import { ResumeAnalysis, InterviewQuestion, JdMatchResult, HistoryItem } from "./types";

export default function App() {
  // Sidebar navigation and primary states
  const [activeTab, setActiveTab] = useState<"dashboard" | "analysis" | "jd-match" | "interview" | "history">("dashboard");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeItem, setActiveItem] = useState<HistoryItem | null>(null);
  
  // App API connection state
  const [apiHealth, setApiHealth] = useState<{ hasApiKey: boolean; status: string } | null>(null);
  
  // Analysis input and process states
  const [pasteText, setPasteText] = useState<string>("");
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>("Initializing...");
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [skillSearch, setSkillSearch] = useState<string>("");

  // JD Match state
  const [jdText, setJdText] = useState<string>("");
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [jdMatchResult, setJdMatchResult] = useState<JdMatchResult | null>(null);
  const [jdMatchError, setJdMatchError] = useState<string | null>(null);

  // Interview state
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestion | null>(null);
  const [userAnswerInput, setUserAnswerInput] = useState<string>("");
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState<boolean>(false);

  // File drag states
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Load history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ai_resume_analyzer_history");
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
        if (parsed.length > 0) {
          setActiveItem(parsed[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load local storage history.", e);
    }

    // Check API health / setup verification
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setApiHealth(data))
      .catch((err) => console.error("API health check failed", err));
  }, []);

  // Save history helper
  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem("ai_resume_analyzer_history", JSON.stringify(newHistory));
  };

  // Convert File to Base64 helper
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle PDF drop / selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setAnalysisError("Only standard application/pdf files are supported.");
        return;
      }
      setUploadedFilename(file.name);
      setAnalysisError(null);
      try {
        const b64 = await fileToBase64(file);
        setPdfBase64(b64);
        setPasteText(""); // Reset paste option
      } catch (err) {
        setAnalysisError("Failed to convert PDF file content into uploadable stream.");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setAnalysisError("Only standard application/pdf files are supported.");
        return;
      }
      setUploadedFilename(file.name);
      setAnalysisError(null);
      try {
        const b64 = await fileToBase64(file);
        setPdfBase64(b64);
        setPasteText(""); // Reset paste option
      } catch (err) {
        setAnalysisError("Failed to parse and read PDF file stream.");
      }
    }
  };

  // Trigger Resume Analysis fetch
  const triggerResumeAnalysis = async () => {
    if (!pdfBase64 && !pasteText.trim()) {
      setAnalysisError("Provide a PDF upload or paste resume text content first.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisProgress("Targeting file layout...");

    // Stagger fake reassurance loaders to keep interface engaged
    const timers = [
      setTimeout(() => setAnalysisProgress("Parsing document structure with Gemini..."), 1200),
      setTimeout(() => setAnalysisProgress("Searching industry keywords and alignment metrics..."), 2800),
      setTimeout(() => setAnalysisProgress("Assembling custom interview prep and ATS actions..."), 4400),
    ];

    try {
      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64: pdfBase64,
          filename: uploadedFilename,
          textFallback: pasteText,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson?.error || "Error analysing resume source.");
      }

      const resData: ResumeAnalysis = await response.json();

      // Create primary analysis run and inject into history list
      const newItem: HistoryItem = {
        id: "run_" + Date.now(),
        filename: uploadedFilename || "Pasted Text Resume",
        timestamp: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        atsScore: resData.atsScore,
        candidateName: resData.candidateName,
        analysis: resData,
      };

      const updatedHistory = [newItem, ...history];
      saveHistory(updatedHistory);
      setActiveItem(newItem);
      
      // Auto redirect to tab views
      setActiveTab("dashboard");
    } catch (err: any) {
      setAnalysisError(err?.message || "Internal server error connecting to AI parser.");
    } finally {
      // Clear timers and state
      timers.forEach(clearTimeout);
      setIsAnalyzing(false);
    }
  };

  // Trigger Job Description Match
  const triggerJdMatch = async () => {
    if (!activeItem) {
      setJdMatchError("Please analyze a resume first in the 'Resume Auditor' tab before executing matcher.");
      return;
    }
    if (!jdText.trim()) {
      setJdMatchError("Please enter or paste a target Job Description to match against.");
      return;
    }

    setIsMatching(true);
    setJdMatchError(null);

    try {
      const response = await fetch("/api/jd-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: {
            candidateName: activeItem.analysis.candidateName,
            skills: [...activeItem.analysis.technicalSkills, ...activeItem.analysis.softSkills],
            rawText: activeItem.analysis.rawExtractedText || ""
          },
          jdText: jdText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to match resume and JD details.");
      }

      const result: JdMatchResult = await response.json();
      setJdMatchResult(result);

      // Save match results dynamically into active item's history state
      const updatedHistory = history.map((item) => {
        if (item.id === activeItem.id) {
          const updated = {
            ...item,
            matchedJd: { jdText, result },
          };
          setActiveItem(updated); // Update selected active state too
          return updated;
        }
        return item;
      });

      saveHistory(updatedHistory);
    } catch (err: any) {
      setJdMatchError(err?.message || "Error comparing profiles.");
    } finally {
      setIsMatching(false);
    }
  };

  // Trigger customized interview questions engine
  const triggerInterviewGen = async () => {
    if (!activeItem) {
      setQuestionError("Please audit a resume first in the 'Resume Auditor' tab.");
      return;
    }

    setIsGeneratingQuestions(true);
    setQuestionError(null);
    setSelectedQuestion(null);

    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: [...activeItem.analysis.technicalSkills, ...activeItem.analysis.softSkills],
          candidateProfile: activeItem.analysis.candidateName + " - " + activeItem.filename,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to synthesize dynamic interview questionnaires.");
      }

      const data = await response.json();
      const loadedQs: InterviewQuestion[] = data.questions || [];
      setQuestions(loadedQs);

      // Save question deck in history item
      const updatedHistory = history.map((item) => {
        if (item.id === activeItem.id) {
          const updated = {
            ...item,
            questions: loadedQs,
          };
          setActiveItem(updated);
          return updated;
        }
        return item;
      });

      saveHistory(updatedHistory);
      if (loadedQs.length > 0) {
        setSelectedQuestion(loadedQs[0]);
        setUserAnswerInput("");
      }
    } catch (err: any) {
      setQuestionError(err?.message || "Error generating interview lists.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Submit interview practice answer for evaluation
  const submitAnswerForEvaluation = async () => {
    if (!selectedQuestion || !userAnswerInput.trim()) return;

    setIsEvaluatingAnswer(true);

    try {
      const response = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: selectedQuestion.question,
          sampleAnswer: selectedQuestion.sampleAnswer,
          userResponse: userAnswerInput,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to evaluate answers.");
      }

      const evaluationFeedback = await response.json();

      // Update question list items with newly returned score/critique
      const updatedQuestions = (activeItem?.questions || questions).map((q) => {
        if (q.id === selectedQuestion.id) {
          const updatedQ: InterviewQuestion = {
            ...q,
            userResponse: userAnswerInput,
            feedback: evaluationFeedback,
          };
          setSelectedQuestion(updatedQ);
          return updatedQ;
        }
        return q;
      });

      setQuestions(updatedQuestions);

      // Persist feedback into global history
      if (activeItem) {
        const updatedHistory = history.map((item) => {
          if (item.id === activeItem.id) {
            const updated = { ...item, questions: updatedQuestions };
            setActiveItem(updated);
            return updated;
          }
          return item;
        });
        saveHistory(updatedHistory);
      }
    } catch (err) {
      console.error("Evaluation feedback error:", err);
    } finally {
      setIsEvaluatingAnswer(false);
    }
  };

  // Delete history item safely
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    saveHistory(updated);
    if (activeItem && activeItem.id === id) {
      setActiveItem(updated.length > 0 ? updated[0] : null);
    }
  };

  // Load selected history profile item
  const handleSelectHistory = (item: HistoryItem) => {
    setActiveItem(item);
    setQuestions(item.questions || []);
    setJdMatchResult(item.matchedJd?.result || null);
    setJdText(item.matchedJd?.jdText || "");
    setActiveTab("dashboard");
  };

  // Printable layout window trigger
  const handlePrint = () => {
    window.print();
  };

  // Download interview deck to file
  const downloadInterviewDeck = () => {
    if (questions.length === 0) return;
    const content = JSON.stringify(questions, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeItem?.analysis.candidateName || "Candidate"}_Interview_Deck.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Inline styling overrides for printable layouts
  const printStyles = `
    @media print {
      body * {
        visibility: hidden;
      }
      #print-report, #print-report * {
        visibility: visible;
      }
      #print-report {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: white;
        color: black;
        padding: 24px;
      }
      .no-print {
        display: none !important;
      }
    }
  `;

  // Filter skills based on search term
  const filteredTechSkills = activeItem?.analysis.technicalSkills.filter(s => 
    s.toLowerCase().includes(skillSearch.toLowerCase())
  ) || [];

  const filteredSoftSkills = activeItem?.analysis.softSkills.filter(s => 
    s.toLowerCase().includes(skillSearch.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-[#0d0d12] text-slate-200 flex font-sans select-none antialiased">
      <style>{printStyles}</style>

      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-80 bg-[#0d0d12] border-r border-slate-800 flex flex-col justify-between shrink-0 no-print">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                <Award className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold tracking-tight text-white leading-none mb-1">AI Analyzer</h1>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider">Resume Intelligence</span>
              </div>
            </div>
          </div>

          {/* Connected state indicators */}
          <div className="px-6 py-2.5 bg-[#0d0d12] border-b border-slate-800 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-550">Gemini Core Engine</span>
            {apiHealth?.hasApiKey ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ONLINE
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                KEY MISSING
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "dashboard"
                  ? "bg-slate-800 text-white border-l-4 border-indigo-500"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <TrendingUp className="w-4 h-4 opacity-80" />
              Overview Dashboard
            </button>

            <button
              onClick={() => setActiveTab("analysis")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "analysis"
                  ? "bg-slate-800 text-white border-l-4 border-indigo-500"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <FileText className="w-4 h-4 opacity-80" />
              Resume Auditor
            </button>

            <button
              onClick={() => setActiveTab("jd-match")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "jd-match"
                  ? "bg-slate-800 text-white border-l-4 border-indigo-500"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <Briefcase className="w-4 h-4 opacity-80" />
              JD Match Optimizer
            </button>

            <button
              onClick={() => setActiveTab("interview")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "interview"
                  ? "bg-slate-800 text-white border-l-4 border-indigo-500"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <Sliders className="w-4 h-4 opacity-80" />
              Interview Prep Coach
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "history"
                  ? "bg-slate-800 text-white border-l-4 border-indigo-500"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <History className="w-4 h-4 opacity-80" />
              Analysis History ({history.length})
            </button>
          </nav>
        </div>

        {/* Selected Candidate Active Profile Footer */}
        <div className="p-6 border-t border-slate-800 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-xs text-indigo-300 font-bold uppercase shrink-0">
              {activeItem ? (activeItem.analysis.candidateName.split(" ").map(n => n[0]).slice(0, 2).join("") || "JD") : "JD"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{activeItem ? activeItem.analysis.candidateName : "Jane Doe"}</p>
              <p className="text-xs text-slate-500 truncate">{activeItem ? `ATS Score: ${activeItem.analysis.atsScore}` : "Premium Plan"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW CONTROLLER */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0 bg-[#111118] pb-12">
        {/* Top Navbar Actions */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0d0d12] no-print shrink-0">
          <h2 className="text-base font-semibold text-white">Resume Analysis Dashboard</h2>

          <div className="flex items-center gap-3">
            {activeItem && (
              <button
                onClick={handlePrint}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-md border border-slate-700 transition-all pointer-events-auto"
              >
                Print Full CV Diagnosis
              </button>
            )}

            {!apiHealth?.hasApiKey && (
              <div className="bg-amber-500/15 border border-amber-500/20 text-amber-300 text-xs px-4 py-2 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Missing API Key. Add GEMINI_API_KEY inside the Secrets panel.
              </div>
            )}
          </div>
        </header>

        {/* Content Tabs Switcher */}
        <div className="flex-1 px-8 pt-8 min-w-0">
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Profile Card Header if activeItem is loaded */}
              {activeItem ? (
                <>
                  {/* Dynamic Metric Cards Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* ATS Score Card */}
                    <div className="bg-[#16161e] border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg relative overflow-hidden group">
                      <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-4">ATS Rating Score</p>
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                          <circle
                            cx="64"
                            cy="64"
                            r="58"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray="364"
                            strokeDashoffset={364 - (364 * activeItem.analysis.atsScore) / 100}
                            className="text-indigo-500 transition-all duration-1000"
                          />
                        </svg>
                        <span className="absolute text-4xl font-extrabold text-white">{activeItem.analysis.atsScore}</span>
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1 font-mono uppercase tracking-wide">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          {activeItem.analysis.atsScore >= 85 ? "Excellent Match" : activeItem.analysis.atsScore >= 70 ? "Satisfactory Match" : "Needs Optimization"}
                        </p>
                      </div>
                    </div>

                    {/* Technical Skills Card */}
                    <div className="bg-[#16161e] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-4">Technical Skills</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-extrabold tracking-tight text-white">{activeItem.analysis.technicalSkills.length}</span>
                          <span className="text-slate-500 font-medium text-sm">skills found</span>
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t border-slate-800">
                        <p className="text-xs text-indigo-300 font-medium uppercase tracking-wider mb-2">Core Stack Highlight</p>
                        <div className="flex flex-wrap gap-1.5">
                          {activeItem.analysis.technicalSkills.slice(0, 3).map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-slate-850 text-indigo-300 text-[10px] rounded border border-indigo-500/20 font-mono">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Soft Skills Card */}
                    <div className="bg-[#16161e] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-4">Soft Skills traits</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-extrabold tracking-tight text-white">{activeItem.analysis.softSkills.length}</span>
                          <span className="text-slate-500 font-medium text-sm">traits found</span>
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t border-slate-800">
                        <p className="text-xs text-purple-300 font-medium uppercase tracking-wider mb-2">Key Behavioral Attributes</p>
                        <div className="flex flex-wrap gap-1.5">
                          {activeItem.analysis.softSkills.slice(0, 3).map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-slate-850 text-purple-300 text-[10px] rounded border border-purple-500/20 font-mono">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* JD Alignment Card */}
                    <div className="bg-[#16161e] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden">
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-4">Job Description Match</p>
                        {activeItem.matchedJd ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-extrabold tracking-tight text-white">{activeItem.matchedJd.result.matchPercentage}%</span>
                            <span className="text-slate-500 font-medium text-sm">overall fit</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-500 text-xs italic block mb-3 font-mono">Unlinked matching template</span>
                            <button
                              onClick={() => setActiveTab("jd-match")}
                              className="text-[11px] bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white font-semibold py-1.5 px-3 rounded-md transition-all border border-slate-700 inline-flex items-center gap-1.5"
                            >
                              Compare to JD
                            </button>
                          </div>
                        )}
                      </div>
                      {activeItem.matchedJd && (
                        <div className="mt-6 pt-4 border-t border-slate-800">
                          <p className="text-xs text-emerald-400 font-semibold font-mono uppercase tracking-wide truncate">
                            🎯 {activeItem.matchedJd.result.matchPercentage >= 80 ? "Highly compatible profile" : "Partially aligned profile"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Two-Column Core Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Primary Audit Summary Panel */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* Candidate Coordinates Summary */}
                      <div className="bg-[#16161e] border border-slate-800 p-6 rounded-2xl shadow-lg">
                        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                          <User className="w-4 h-4 text-indigo-400" />
                          Candidate Profile Registry
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-[#0d0d12] p-4 border border-slate-800 rounded-xl">
                            <span className="text-xs font-mono text-slate-500 block mb-1">Full Name</span>
                            <span className="text-sm font-semibold text-white truncate block">{activeItem.analysis.candidateName}</span>
                          </div>
                          <div className="bg-[#0d0d12] p-4 border border-slate-800 rounded-xl">
                            <span className="text-xs font-mono text-slate-500 block mb-1">Email Address</span>
                            <span className="text-sm font-semibold text-white truncate block">{activeItem.analysis.email}</span>
                          </div>
                          <div className="bg-[#0d0d12] p-4 border border-slate-800 rounded-xl">
                            <span className="text-xs font-mono text-slate-500 block mb-1">Phone Reference</span>
                            <span className="text-sm font-semibold text-white truncate block">{activeItem.analysis.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Diagnostic Analysis Tabs Quick Access */}
                      <div className="bg-[#16161e] border border-slate-800 p-6 rounded-2xl shadow-lg space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-indigo-400" />
                            Resume Diagnosis Key Takeaways
                          </h3>
                          <button
                            onClick={() => setActiveTab("analysis")}
                            className="text-xs text-indigo-400 hover:text-white font-mono flex items-center gap-1 transition"
                          >
                            Explore Detailed Auditor <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-xl">
                            <h4 className="text-xs font-mono text-emerald-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4" /> Strong Aspects
                            </h4>
                            <ul className="space-y-2">
                              {activeItem.analysis.strengths.slice(0, 3).map((item, idx) => (
                                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                  <span className="text-emerald-400 mt-0.5">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-xl">
                            <h4 className="text-xs font-mono text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4" /> Area Gaps Found
                            </h4>
                            <ul className="space-y-2">
                              {activeItem.analysis.weaknesses.slice(0, 3).map((item, idx) => (
                                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                  <span className="text-amber-400 mt-0.5">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sidebar action and recommendations lists */}
                    <div className="space-y-8">
                      {/* Interactive Blueprint Recommendations Panel */}
                      <div className="bg-[#16161e] border border-slate-800 p-6 rounded-2xl shadow-lg space-y-4">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Award className="w-4 h-4 text-indigo-400" />
                          Priority Action Items
                        </h3>
                        <div className="space-y-3.5">
                          {activeItem.analysis.recommendations.slice(0, 4).map((item, index) => (
                            <div key={index} className="flex gap-3 bg-[#0d0d12] p-3.5 border border-slate-800 rounded-xl">
                              <div className="bg-indigo-500/10 text-indigo-400 w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-500/15">
                                {index + 1}
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mock Practice Interactive Quiz Entry widget */}
                      <div className="bg-[#16161e] border border-slate-800 p-6 rounded-2xl shadow-lg space-y-4">
                        <div>
                          <span className="text-[10px] bg-indigo-500/15 text-indigo-400 font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            Interactive Prep
                          </span>
                          <h3 className="text-sm font-bold text-white mt-1.5 leading-tight">Tailored Exam Practice Room</h3>
                          <p className="text-xs text-slate-400 mt-1 leading-normal">
                            Test your skillset dynamically based on the parsed resume characteristics. Let the system audit answers instantly.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab("interview");
                            if (questions.length === 0) triggerInterviewGen();
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10 transition"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          {questions.length > 0 ? "Resume Interactive Practice" : "Generate Dynamic Decks"}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* EMPTY PLACEHOLDER - Direct user to load/upload a resume */
                <div className="bg-[#16161e] border border-slate-800 rounded-2xl p-16 text-center max-w-2xl mx-auto space-y-6 shadow-xl">
                  <div className="bg-slate-900 border border-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                    <FileText className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">No Active Audited Resume</h2>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                      Please upload a resume PDF file or enter your qualifications text block to construct the analytics audit dashboards.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("analysis")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs inline-flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
                  >
                    <Upload className="w-4 h-4" /> Load Resume Auditor
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RESUME AUDITOR */}
          {activeTab === "analysis" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* INPUT BOX (LEFT AREA) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#16161e] border border-slate-800 p-6 rounded-2xl shadow-lg space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    Load Resume Source
                  </h3>

                  {/* DROPZONE */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer relative ${
                      isDragOver
                        ? "border-indigo-400 bg-indigo-500/5 text-indigo-200"
                        : pdfBase64
                        ? "border-indigo-500/40 bg-slate-900/40"
                        : "border-slate-800 hover:border-slate-700 bg-[#0d0d12]"
                    }`}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-3 pointer-events-none">
                      <div className="bg-[#0d0d12] border border-slate-800 w-11 h-11 rounded-xl flex items-center justify-center mx-auto shadow-sm">
                        <Upload className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-white">Drag & drop PDF here</p>
                        <p className="text-[10px] text-slate-400">or click to choose file</p>
                      </div>
                    </div>
                  </div>

                  {pdfBase64 && (
                    <div className="bg-[#0d0d12] border border-slate-800 p-3 rounded-lg flex items-center justify-between text-xs font-mono text-slate-300">
                      <span className="truncate flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        {uploadedFilename}
                      </span>
                      <button
                        onClick={() => {
                          setPdfBase64(null);
                          setUploadedFilename("");
                        }}
                        className="text-slate-500 hover:text-white transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="relative flex py-2 items-center text-xs text-slate-550">
                    <div className="flex-grow border-t border-slate-800"></div>
                    <span className="flex-shrink mx-3 uppercase font-mono tracking-widest text-[9px]">OR PASTE SOURCE TEXT</span>
                    <div className="flex-grow border-t border-slate-800"></div>
                  </div>

                  {/* Fallback Textarea Input option */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-mono text-slate-500 block">Plain Qualification Text Block</label>
                    <textarea
                      value={pasteText}
                      onChange={(e) => {
                        setPasteText(e.target.value);
                        if (e.target.value) {
                          setPdfBase64(null);
                          setUploadedFilename("");
                        }
                      }}
                      placeholder="Paste executive summaries, role accomplishments details, and skills lists directly..."
                      className="w-full h-44 bg-[#0d0d12] border border-slate-800 p-4 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none font-mono"
                    />
                  </div>

                  {/* ANALYSIS TRIGGER BUTTON */}
                  <button
                    onClick={triggerResumeAnalysis}
                    disabled={isAnalyzing || (!pdfBase64 && !pasteText.trim())}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/10"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white" />
                        Execute Auditor Analysis
                      </>
                    )}
                  </button>
                </div>

                {isAnalyzing && (
                  <div className="bg-[#16161e] border border-slate-800 p-4 rounded-2xl text-center space-y-2">
                    <p className="text-xs font-mono text-indigo-400 animate-pulse">{analysisProgress}</p>
                    <div className="w-full bg-[#0d0d12] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full animate-[progress_15s_ease-out]"></div>
                    </div>
                  </div>
                )}

                {analysisError && (
                  <div className="bg-red-500/10 border border-red-500/15 p-4 rounded-2xl flex items-start gap-2 text-xs text-red-300">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{analysisError}</span>
                  </div>
                )}
              </div>

              {/* AUDITED DETAILED SHEETS (RIGHT AREA) */}
              <div className="lg:col-span-8">
                {activeItem ? (
                  <div id="print-report" className="bg-[#16161e] border border-slate-800 rounded-2xl p-8 space-y-8 shadow-lg">
                    {/* Header Resume Analysis Sheet */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded uppercase font-mono font-bold tracking-wider">
                            ATS Diagnostic Sheet
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">{activeItem.timestamp}</span>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-white mt-1">{activeItem.analysis.candidateName}</h2>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-400 text-xs mt-1.5 font-mono">
                          <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-500" /> {activeItem.analysis.email}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-500" /> {activeItem.analysis.phone}</span>
                        </div>
                      </div>

                      {/* Concentric Circle scoring review */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 flex items-center justify-center bg-[#0d0d12] rounded-full border border-slate-800">
                          <span className="text-xl font-black text-indigo-400">{activeItem.analysis.atsScore}</span>
                          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              fill="transparent"
                              className="text-slate-800"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="transparent"
                              className="text-indigo-400"
                              strokeDasharray={2 * Math.PI * 28}
                              strokeDashoffset={2 * Math.PI * 28 * (1 - activeItem.analysis.atsScore / 100)}
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">Calculated ATS Base</p>
                          <span className="text-[10px] text-slate-400 font-mono">Relevance index score</span>
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-xl">
                        <h4 className="text-xs font-mono text-emerald-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" /> Strong Aspects
                        </h4>
                        <ul className="space-y-3">
                          {activeItem.analysis.strengths.map((item, idx) => (
                            <li key={idx} className="text-xs text-slate-300 flex items-start gap-2.5">
                              <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-xl">
                        <h4 className="text-xs font-mono text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" /> Identified Structural Weaknesses
                        </h4>
                        <ul className="space-y-3">
                          {activeItem.analysis.weaknesses.map((item, idx) => (
                            <li key={idx} className="text-xs text-slate-300 flex items-start gap-2.5">
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Skill Registry Table Row */}
                    <div className="space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h4 className="text-xs uppercase tracking-wider font-mono text-slate-400">Extracted Skills Inventory</h4>
                        <div className="relative max-w-xs">
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={skillSearch}
                            onChange={(e) => setSkillSearch(e.target.value)}
                            placeholder="Search skills inventory..."
                            className="bg-[#0d0d12] border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0d0d12] p-5 border border-slate-800 rounded-xl">
                        <div>
                          <h5 className="text-[11px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-2 mb-3">
                            Hard & Technical Stacks ({filteredTechSkills.length})
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {filteredTechSkills.map((s, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-[#16161e] text-slate-300 px-3 py-1 rounded-lg border border-slate-800 hover:border-indigo-500/25 transition cursor-default"
                              >
                                {s}
                              </span>
                            ))}
                            {filteredTechSkills.length === 0 && (
                              <span className="text-xs text-slate-600 font-mono italic">No technical skills detected matching query</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h5 className="text-[11px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-2 mb-3">
                            Soft & Behavioral Traits ({filteredSoftSkills.length})
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {filteredSoftSkills.map((s, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-[#16161e] text-slate-300 px-3 py-1 rounded-lg border border-slate-800 hover:border-indigo-500/25 transition cursor-default"
                              >
                                {s}
                              </span>
                            ))}
                            {filteredSoftSkills.length === 0 && (
                              <span className="text-xs text-slate-600 font-mono italic">No soft skills detected matching query</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Blueprint list */}
                    <div className="space-y-3.5">
                      <h4 className="text-xs uppercase tracking-wider font-mono text-slate-400">Actionable Improvement Blueprint</h4>
                      <div className="space-y-3">
                        {activeItem.analysis.recommendations.map((rec, index) => (
                          <div key={index} className="flex gap-4 p-4 bg-[#0d0d12] border border-slate-800 rounded-xl">
                            <div className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0">
                              {index + 1}
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs text-slate-200 leading-relaxed font-semibold">Priority Recommendation Step</p>
                              <p className="text-xs text-slate-300 leading-relaxed">{rec}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#16161e] border border-slate-800 rounded-2xl p-16 text-center text-slate-400 space-y-4 shadow-lg">
                    <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                    <div>
                      <h3 className="text-base font-bold text-slate-300">No Audited Report</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-normal">
                        Submit qualifications PDF file or copy-paste skills text inside the loader module to produce structural analyses sheets.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: JD MATCH OPTIMIZER */}
          {activeTab === "jd-match" && (
            <div className="space-y-8">
              {/* Requirements & active checking safeguard */}
              {!activeItem ? (
                <div className="bg-[#16161e] border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-lg">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                  <div>
                    <h3 className="text-base font-bold text-white">Active Audited Profile Required</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      You must run the Resume Auditor first to parse details before comparing profile metrics against Job Descriptions.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("analysis")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
                  >
                    Go To Auditor <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* JD TEXTAREA SUBMISSION CARD */}
                  <div className="lg:col-span-5 bg-[#16161e] border border-slate-800 p-6 rounded-2xl space-y-4 shadow-lg">
                    <div>
                      <span className="text-[10px] bg-[#0d0d12] border border-slate-800 px-2 py-0.5 rounded font-mono text-slate-400 font-bold">
                        Target Context
                      </span>
                      <h3 className="text-base font-bold text-white mt-1">Establish Target Job Description</h3>
                    </div>

                    <textarea
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      placeholder="Paste target job guidelines, technical requirements matrix, roles, responsibilities, and qualifications outline here..."
                      className="w-full h-96 bg-[#0d0d12] border border-slate-800 p-4 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none font-mono"
                    />

                    {jdMatchError && (
                      <div className="text-xs bg-red-500/10 border border-red-500/15 p-3 rounded-xl text-red-300 flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{jdMatchError}</span>
                      </div>
                    )}

                    <button
                      onClick={triggerJdMatch}
                      disabled={isMatching || !jdText.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/10"
                    >
                      {isMatching ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          Analyzing Profile Fit...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-white" />
                          Compare & Align Metrics
                        </>
                      )}
                    </button>
                  </div>

                  {/* ALIGNMENT ANALYSIS AND SUGGESTIONS (RIGHT AREA) */}
                  <div className="lg:col-span-7">
                    {jdMatchResult ? (
                      <div className="bg-[#16161e] border border-slate-800 rounded-2xl p-8 space-y-8 shadow-lg">
                        {/* Summary Header */}
                        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                          <div>
                            <h3 className="text-lg font-bold text-white">Compare Index Details</h3>
                            <p className="text-xs text-slate-400">Match summary review generated by Gemini AI</p>
                          </div>

                          <div className="flex items-center gap-3 bg-[#0d0d12] p-4 border border-slate-800 rounded-xl">
                            <span className="text-3xl font-extrabold text-white">{jdMatchResult.matchPercentage}%</span>
                            <div>
                              <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Alignment Gauge</p>
                              <span className="text-[10px] text-emerald-400 font-semibold">
                                {jdMatchResult.matchPercentage >= 80 ? "High Match Rate" : 
                                 jdMatchResult.matchPercentage >= 60 ? "Moderate Match Rate" : "Low Match Rate"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Badges Matrix */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3.5">
                            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Key Keywords Located ({jdMatchResult.strongMatches.length})
                            </h4>
                            <div className="flex flex-wrap gap-1.5 p-4 bg-[#0d0d12] border border-slate-800 rounded-xl">
                              {jdMatchResult.strongMatches.map((m, idx) => (
                                <span key={idx} className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 py-1 px-2.5 rounded-full">
                                  {m}
                                </span>
                              ))}
                              {jdMatchResult.strongMatches.length === 0 && (
                                <span className="text-xs text-slate-500 italic">No direct matches identified.</span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3.5">
                            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Missing Gaps & Skills ({jdMatchResult.missingSkills.length})
                            </h4>
                            <div className="flex flex-wrap gap-1.5 p-4 bg-[#0d0d12] border border-slate-800 rounded-xl">
                              {jdMatchResult.missingSkills.map((m, idx) => (
                                <span key={idx} className="text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/15 py-1 px-2.5 rounded-full">
                                  {m}
                                </span>
                              ))}
                              {jdMatchResult.missingSkills.length === 0 && (
                                <span className="text-xs text-slate-500 italic">All critical parameters addressed!</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Specific tailoring instructions */}
                        <div className="space-y-3.5">
                          <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400">Layout Optimization Suggestions</h4>
                          <div className="space-y-3">
                            {jdMatchResult.improvementSuggestions.map((tip, idx) => (
                              <div key={idx} className="flex gap-3 bg-[#0d0d12] p-3.5 border border-slate-800 rounded-xl text-xs text-slate-300">
                                <span className="text-indigo-400 font-bold shrink-0">🎯</span>
                                <p className="leading-relaxed">{tip}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Copyable optimized personal objective summary */}
                        <div className="space-y-3.5 bg-[#0d0d12] border border-slate-800 p-5 rounded-xl relative">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400">Tailored Resume Objective Hook</h4>
                            <button
                              onClick={() => navigator.clipboard.writeText(jdMatchResult.optimizedObjective)}
                              className="text-[10px] bg-slate-850 hover:bg-slate-705 text-indigo-400 py-1 px-2.5 rounded border border-slate-700/60 font-semibold"
                            >
                              Copy Hook Text
                            </button>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-mono italic bg-[#16161e] p-4 border border-slate-800 rounded-lg">
                            "{jdMatchResult.optimizedObjective}"
                          </p>
                          <span className="text-[9px] text-slate-550 font-mono block mt-2 text-right">
                            *Utilizes key keywords to score maximal ATS indexing.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#16161e] border border-slate-800 rounded-2xl p-16 text-center text-slate-400 space-y-4 shadow-lg">
                        <Briefcase className="w-12 h-12 text-slate-600 mx-auto" />
                        <div>
                          <h3 className="text-base font-bold text-slate-300">Comparison Ready</h3>
                          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-normal">
                            Paste relevant recruiting guidelines inside the parameters input to trigger alignment calculations.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INTERVIEW COACH */}
          {activeTab === "interview" && (
            <div className="space-y-8">
              {!activeItem ? (
                <div className="bg-[#16161e] border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-lg">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                  <div>
                    <h3 className="text-base font-bold text-white">Active Audit Required</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Load a resume source first in the auditor tab to generate targeted interview questions matching your active stack.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("analysis")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
                  >
                    Go To Auditor <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* GENERATED QUESTION LIST (LEFT BAR) */}
                  <div className="lg:col-span-5 bg-[#16161e] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white">Practice Exam Question List</h3>
                      {questions.length > 0 && (
                        <button
                          onClick={downloadInterviewDeck}
                          className="text-[10px] text-indigo-400 hover:text-white font-mono flex items-center gap-1 transition"
                        >
                          <Download className="w-3.5 h-3.5" /> Export Deck
                        </button>
                      )}
                    </div>

                    {questions.length === 0 ? (
                      <div className="text-center py-12 space-y-4">
                        <p className="text-xs text-slate-400">No active practice questions generated yet.</p>
                        <button
                          onClick={triggerInterviewGen}
                          disabled={isGeneratingQuestions}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#0d0d12]/40 disabled:text-slate-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs inline-flex items-center gap-1.5 transition w-full justify-center shadow-lg shadow-indigo-600/10"
                        >
                          {isGeneratingQuestions ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-white" /> Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-white animate-pulse" />
                              Generate 20 Custom Questions
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Question Selector List */}
                        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                          {questions.map((q) => (
                            <button
                              key={q.id}
                              onClick={() => {
                                setSelectedQuestion(q);
                                setUserAnswerInput(q.userResponse || "");
                              }}
                              className={`w-full text-left p-3.5 rounded-xl border transition text-xs relative ${
                                selectedQuestion?.id === q.id
                                  ? "bg-[#0d0d12] border-indigo-500 text-white"
                                  : "bg-[#0d0d12]/50 border-slate-800 text-slate-300 hover:bg-[#0d0d12]"
                              }`}
                            >
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[9px] uppercase font-mono bg-slate-800/80 px-2 py-0.5 rounded text-indigo-400 border border-slate-700/55">
                                  {q.type}
                                </span>
                                <span className={`text-[9px] font-mono ${
                                  q.difficulty === 'Advanced' ? 'text-rose-400' :
                                  q.difficulty === 'Intermediate' ? 'text-amber-400' : 'text-emerald-400'
                                }`}>
                                  {q.difficulty}
                                </span>
                              </div>
                              <p className="leading-relaxed font-medium truncate">{q.question}</p>
                              {q.feedback && (
                                <span className="absolute bottom-2.5 right-3 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">
                                  Score: {q.feedback.score}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Regenerate Trigger */}
                        <button
                          onClick={triggerInterviewGen}
                          disabled={isGeneratingQuestions}
                          className="w-full text-xs text-center border border-slate-805 hover:border-slate-700 bg-[#0d0d12] text-slate-400 hover:text-white py-2.5 rounded-xl transition"
                        >
                          {isGeneratingQuestions ? "Regenerating..." : "Regenerate Interactive Sets"}
                        </button>
                      </>
                    )}
                  </div>

                  {/* ACTIVE QUESTION PANEL (RIGHT) */}
                  <div className="lg:col-span-7">
                    {selectedQuestion ? (
                      <div className="bg-[#16161e] border border-slate-800 rounded-2xl p-8 space-y-8 shadow-lg">
                        {/* Selected Question Header */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] bg-slate-800 text-indigo-400 font-mono font-bold px-2.5 py-0.5 rounded border border-slate-700/80">
                              Question Details
                            </span>
                            <span className="text-xs font-semibold text-slate-550">Practice Portal API</span>
                          </div>
                          <h2 className="text-lg font-bold text-white leading-normal">{selectedQuestion.question}</h2>
                        </div>

                        {/* Answer Input and Prompt Evaluation */}
                        <div className="space-y-4">
                          <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Draft Response Block</label>
                          <textarea
                            value={userAnswerInput}
                            onChange={(e) => setUserAnswerInput(e.target.value)}
                            placeholder="Draft your detailed verbal practice answer or coding outline response..."
                            className="w-full h-44 bg-[#0d0d12] border border-slate-800 p-4 rounded-xl text-xs text-slate-300 font-mono leading-relaxed placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none"
                          />

                          <button
                            onClick={submitAnswerForEvaluation}
                            disabled={isEvaluatingAnswer || !userAnswerInput.trim()}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold py-2.5 px-5 rounded-xl text-xs inline-flex items-center gap-1.5 transition shadow-md shadow-indigo-600/10"
                          >
                            {isEvaluatingAnswer ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin text-white" /> Analyzing response...
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" /> Evaluate Answer
                              </>
                            )}
                          </button>
                        </div>

                        {/* Grading Feedback Results Section if available */}
                        {selectedQuestion.feedback && (
                          <div className="bg-[#0d0d12] border border-slate-800 p-6 rounded-xl space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                              <div>
                                <h3 className="text-sm font-bold text-white">Coach Performance Grades</h3>
                                <p className="text-[10px] text-slate-400 font-mono">Expert rating report</p>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-black text-emerald-400 block">{selectedQuestion.feedback.score} / 100</span>
                                <span className="text-[10px] font-mono text-slate-550 bg-[#16161e] px-1.5 py-0.5 rounded inline-block mt-0.5">
                                  {selectedQuestion.feedback.rating}
                                </span>
                              </div>
                            </div>

                            {/* Critique text */}
                            <div className="space-y-1.5">
                              <h4 className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Constructive Critique</h4>
                              <p className="text-xs text-slate-350 leading-relaxed font-mono italic">
                                "{selectedQuestion.feedback.critique}"
                              </p>
                            </div>

                            {/* Ideal targets point omitted */}
                            <div className="space-y-2">
                              <h4 className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Missed Points & Recommended Keywords</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedQuestion.feedback.suggestedPoints.map((pt, idx) => (
                                  <span key={idx} className="text-[10px] bg-indigo-950/40 text-indigo-300 border border-indigo-900/40 py-1 px-3 rounded-full">
                                    {pt}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Ideal Sample Answer Reference Accordion */}
                        <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0d0d12]/40">
                          <details className="group">
                            <summary className="flex justify-between items-center p-4 text-xs font-semibold text-slate-400 cursor-pointer hover:bg-slate-900/20 transition">
                              <span>Reveal Expert Best Answer Reference</span>
                              <ChevronRight className="w-4 h-4 transform group-open:rotate-90 transition-transform" />
                            </summary>
                            <div className="p-4 border-t border-slate-800 bg-[#0d0d12] text-[11px] leading-relaxed text-slate-350 font-mono">
                              <p className="whitespace-pre-line">{selectedQuestion.sampleAnswer}</p>
                            </div>
                          </details>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#16161e] border border-slate-800 rounded-2xl p-16 text-center text-slate-400 space-y-4 shadow-lg">
                        <Sliders className="w-12 h-12 text-slate-600 mx-auto" />
                        <div>
                          <h3 className="text-base font-bold text-slate-300">Question Not Selected</h3>
                          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-normal">
                            Choose an individual question card from the practice deck panel to review detailed context files.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: RUN HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-6">
              <div className="bg-[#16161e] border border-slate-800 p-8 rounded-2xl space-y-4 shadow-lg">
                <div>
                  <h2 className="text-lg font-bold text-white">Candidate Historic Runs Archive</h2>
                  <p className="text-xs text-slate-400">Choose, restore, or manage stored profiles from active session local states</p>
                </div>

                {history.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 space-y-3">
                    <History className="w-12 h-12 text-slate-700 mx-auto" />
                    <p className="text-xs">No analysis histories found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-300">
                      <thead className="text-[10px] uppercase tracking-wider font-mono bg-[#0d0d12] text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-6 py-4">Timestamp</th>
                          <th className="px-6 py-4">Nominee Name</th>
                          <th className="px-6 py-4">Uploaded Reference</th>
                          <th className="px-6 py-4">ATS Grade</th>
                          <th className="px-6 py-4">JD Match Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => handleSelectHistory(item)}
                            className={`border-b border-slate-800/60 hover:bg-[#0d0d12]/50 cursor-pointer transition ${
                              activeItem?.id === item.id ? "bg-[#0d0d12] text-white" : ""
                            }`}
                          >
                            <td className="px-6 py-4 font-mono text-slate-400">{item.timestamp}</td>
                            <td className="px-6 py-4 font-semibold">{item.analysis.candidateName}</td>
                            <td className="px-6 py-4 max-w-xs truncate font-mono text-slate-450">{item.filename}</td>
                            <td className="px-6 py-4">
                              <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                                item.atsScore >= 80 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-500"
                              }`}>
                                {item.atsScore} / 100
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono">
                              {item.matchedJd ? (
                                <span className="bg-indigo-950/40 text-indigo-300 border border-indigo-900/30 py-0.5 px-2 rounded">
                                  {item.matchedJd.result.matchPercentage}% Linked
                                </span>
                              ) : (
                                <span className="text-slate-500 italic">Unlinked</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={(e) => deleteHistoryItem(item.id, e)}
                                className="text-slate-550 hover:text-rose-400 p-2 rounded-xl hover:bg-slate-800/80 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
