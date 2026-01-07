'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import type { Survey, Question } from '@/types';

interface SurveyPageProps {
    params: Promise<{ id: string }>;
}

export default function SurveyPage({ params }: SurveyPageProps) {
    const { id } = use(params);
    const router = useRouter();

    const [survey, setSurvey] = useState<Survey | null>(null);
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        async function fetchSurvey() {
            try {
                const response = await fetch(`/api/surveys/${id}`);
                const data = await response.json();

                if (data.success && data.survey) {
                    setSurvey(data.survey);
                    // Initialize answers
                    const initialAnswers: Record<string, string | string[]> = {};
                    data.survey.questions.forEach((q: Question) => {
                        if (q.type === 'multiple_choice') {
                            initialAnswers[q.id] = [];
                        } else {
                            initialAnswers[q.id] = '';
                        }
                    });
                    setAnswers(initialAnswers);
                } else {
                    setError(data.error || '설문을 불러올 수 없습니다.');
                }
            } catch (err) {
                console.error('Fetch error:', err);
                setError('설문 조회 중 오류가 발생했습니다.');
            } finally {
                setIsLoading(false);
            }
        }

        fetchSurvey();
    }, [id]);

    const handleSingleChoice = (questionId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleMultipleChoice = (questionId: string, value: string) => {
        setAnswers(prev => {
            const current = (prev[questionId] as string[]) || [];
            if (current.includes(value)) {
                return { ...prev, [questionId]: current.filter(v => v !== value) };
            } else {
                return { ...prev, [questionId]: [...current, value] };
            }
        });
    };

    const handleTextChange = (questionId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async () => {
        if (!survey) return;

        // Validate required fields
        const unanswered = survey.questions.filter(q => {
            if (!q.required) return false;
            const answer = answers[q.id];
            if (Array.isArray(answer)) return answer.length === 0;
            return !answer || answer.trim() === '';
        });

        if (unanswered.length > 0) {
            setError(`필수 질문에 답변해주세요: ${unanswered.map((_, i) => i + 1).join(', ')}`);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    surveyId: id,
                    answers,
                    respondentType: survey.target,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSubmitted(true);
            } else {
                setError(data.error || '제출에 실패했습니다.');
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError('제출 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate progress
    const progress = survey
        ? Math.round((Object.values(answers).filter(a =>
            Array.isArray(a) ? a.length > 0 : a && String(a).trim() !== ''
        ).length / survey.questions.length) * 100)
        : 0;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#137fec] border-t-transparent"></div>
                    <span>설문을 불러오는 중...</span>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
                    <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">제출 완료!</h1>
                    <p className="text-gray-500 mb-6">설문에 참여해 주셔서 감사합니다.</p>
                    <button
                        onClick={() => window.close()}
                        className="px-6 py-2 bg-[#137fec] text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                        창 닫기
                    </button>
                </div>
            </div>
        );
    }

    if (error && !survey) {
        return (
            <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f7f8] flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-gray-200 bg-white px-6 py-4 sticky top-0 z-50">
                <div className="flex items-center gap-3 text-gray-900 mx-auto max-w-3xl w-full">
                    <div className="size-6 text-[#137fec]">
                        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z"
                                fill="currentColor"
                            />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">AI 설문 마법사</h2>
                    <div className="ml-auto text-sm text-gray-500 font-medium hidden sm:block">
                        {survey?.target === 'student' ? '학생용' : survey?.target === 'teacher' ? '교사용' : '학부모용'}
                    </div>
                </div>
            </header>

            {/* Progress */}
            <div className="w-full h-1 bg-gray-200">
                <div
                    className="h-full bg-[#137fec] rounded-r-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            {/* Main Content */}
            <main className="flex-1 flex justify-center py-8 px-4 sm:px-6">
                <div className="w-full max-w-3xl flex flex-col gap-6">
                    {/* Survey Title Card */}
                    <div className="bg-white rounded-xl shadow-sm border-t-8 border-t-[#137fec] border-x border-b border-gray-200 overflow-hidden">
                        <div className="p-8 flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-gray-900">
                                    {survey?.title}
                                </h1>
                                {survey?.description && (
                                    <p className="text-gray-500 text-base font-normal leading-relaxed mt-2">
                                        {survey.description}
                                    </p>
                                )}
                                <span className="text-red-500 text-sm mt-1 inline-block">* 필수 항목</span>
                            </div>
                        </div>
                    </div>

                    {/* Questions */}
                    {survey?.questions.map((question, index) => (
                        <div
                            key={question.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 transition-shadow hover:shadow-md"
                        >
                            <div className="flex flex-col gap-4">
                                <h3 className="text-lg md:text-xl font-bold leading-tight text-gray-900 flex items-start gap-1">
                                    {index + 1}. {question.question}
                                    {question.required && <span className="text-red-500 ml-1">*</span>}
                                </h3>

                                {/* Single Choice */}
                                {question.type === 'single_choice' && (
                                    <div className="flex flex-col gap-3 mt-2">
                                        {question.options?.map((option, optionIndex) => (
                                            <label
                                                key={optionIndex}
                                                className="group flex items-center gap-4 rounded-lg border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 hover:border-[#137fec]/50 transition-colors"
                                            >
                                                <input
                                                    type="radio"
                                                    name={question.id}
                                                    value={option}
                                                    checked={answers[question.id] === option}
                                                    onChange={() => handleSingleChoice(question.id, option)}
                                                    className="h-5 w-5 border-2 border-gray-300 text-[#137fec] focus:ring-offset-0 focus:ring-2 focus:ring-[#137fec]/20 cursor-pointer bg-transparent"
                                                />
                                                <span className="text-gray-700 text-sm font-medium leading-normal group-hover:text-[#137fec] transition-colors">
                                                    {option}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {/* Multiple Choice */}
                                {question.type === 'multiple_choice' && (
                                    <div className="flex flex-col gap-3 mt-2">
                                        {question.options?.map((option, optionIndex) => (
                                            <label
                                                key={optionIndex}
                                                className="group flex items-center gap-4 rounded-lg border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 hover:border-[#137fec]/50 transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    value={option}
                                                    checked={(answers[question.id] as string[])?.includes(option)}
                                                    onChange={() => handleMultipleChoice(question.id, option)}
                                                    className="h-5 w-5 border-2 border-gray-300 text-[#137fec] rounded focus:ring-offset-0 focus:ring-2 focus:ring-[#137fec]/20 cursor-pointer bg-transparent"
                                                />
                                                <span className="text-gray-700 text-sm font-medium leading-normal group-hover:text-[#137fec] transition-colors">
                                                    {option}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {/* Text Input */}
                                {question.type === 'text' && (
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            value={answers[question.id] as string}
                                            onChange={(e) => handleTextChange(question.id, e.target.value)}
                                            placeholder="답변을 입력하세요"
                                            className="w-full rounded-lg border border-gray-300 bg-white p-4 text-gray-900 placeholder-gray-400 focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec]"
                                        />
                                    </div>
                                )}

                                {/* Long Text */}
                                {question.type === 'long_text' && (
                                    <div className="mt-2">
                                        <textarea
                                            value={answers[question.id] as string}
                                            onChange={(e) => handleTextChange(question.id, e.target.value)}
                                            placeholder="답변을 입력하세요"
                                            rows={4}
                                            className="w-full min-h-[140px] rounded-lg border border-gray-300 bg-white p-4 text-gray-900 placeholder-gray-400 focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] resize-y leading-relaxed"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex flex-col items-center gap-6 mt-4 pb-12">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto min-w-[200px] h-12 bg-[#137fec] hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    <span>제출 중...</span>
                                </>
                            ) : (
                                <>
                                    <span>제출하기</span>
                                    <span className="material-symbols-outlined text-lg">send</span>
                                </>
                            )}
                        </button>
                        <div className="flex flex-col items-center gap-2 text-gray-400 text-xs mt-4">
                            <div className="flex items-center gap-2 opacity-60">
                                <span className="material-symbols-outlined text-base">lock</span>
                                <span>이 설문은 안전하게 암호화되어 전송됩니다.</span>
                            </div>
                            <div className="font-medium opacity-40">Powered by AI Survey Wizard</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
