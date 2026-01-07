// Survey Types
export type SurveyTarget = 'student' | 'teacher' | 'parent';
export type SurveyMode = 'classic' | 'interview';
export type QuestionType = 'single_choice' | 'multiple_choice' | 'text' | 'long_text';

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  required?: boolean;
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  target: SurveyTarget;
  mode: SurveyMode;
  questions: Question[];
  sourceFileUrl?: string;
  sourcePrompt?: string;
  createdAt: Date;
  status: 'draft' | 'published';
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentType: SurveyTarget;
  answers: Record<string, string | string[]>;
  interviewLog?: ChatMessage[];
  submittedAt: Date;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// API Request/Response Types
export interface GenerateSurveyRequest {
  target: SurveyTarget;
  mode: SurveyMode;
  prompt?: string;
  text?: string;
  imageBase64?: string;
}

export interface GenerateSurveyResponse {
  success: boolean;
  surveyId?: string;
  error?: string;
}

// Target/Mode Labels
export const TARGET_LABELS: Record<SurveyTarget, string> = {
  student: '학생',
  teacher: '교사',
  parent: '학부모',
};

export const MODE_LABELS: Record<SurveyMode, string> = {
  classic: '클래식',
  interview: '인터뷰',
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: '객관식 질문',
  multiple_choice: '체크박스',
  text: '단답형',
  long_text: '장문형',
};
