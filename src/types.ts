export interface ResumeAnalysis {
  id: string;
  filename: string;
  timestamp: string;
  candidateName: string;
  email: string;
  phone: string;
  atsScore: number;
  technicalSkills: string[];
  softSkills: string[];
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  recommendations: string[];
  rawExtractedText?: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  type: 'technical' | 'hr' | 'project';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  sampleAnswer: string;
  userResponse?: string;
  feedback?: {
    score: number; // 0-100
    rating: string; // e.g. "Excellent", "Needs Improvement"
    critique: string;
    suggestedPoints: string[];
  };
}

export interface JdMatchResult {
  matchPercentage: number;
  strongMatches: string[];
  missingSkills: string[];
  improvementSuggestions: string[];
  keywordsFound: string[];
  optimizedObjective: string; // Dynamic recommendation for summary or objective
}

export interface HistoryItem {
  id: string;
  filename: string;
  timestamp: string;
  atsScore: number;
  candidateName: string;
  analysis: ResumeAnalysis;
  matchedJd?: {
    jdText: string;
    result: JdMatchResult;
  };
  questions?: InterviewQuestion[];
}
