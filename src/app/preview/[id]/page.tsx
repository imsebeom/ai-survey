'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import type { Survey, Question, QuestionType } from '@/types';
import { getSurvey, updateSurvey } from '@/lib/firebase';
import { QUESTION_TYPE_LABELS } from '@/types';

interface PreviewPageProps {
    params: Promise<{ id: string }>;
}

export default function PreviewPage({ params }: PreviewPageProps) {
    const { id } = use(params);
    const router = useRouter();

    const [survey, setSurvey] = useState<Survey | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSurvey() {
            try {
                // Direct Firestore call
                const data = await getSurvey(id);

                if (data) {
                    setSurvey(data);
                } else {
                    setError('설문을 불러올 수 없습니다.');
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

    const updateQuestion = (index: number, updates: Partial<Question>) => {
        if (!survey) return;

        const newQuestions = [...survey.questions];
        newQuestions[index] = { ...newQuestions[index], ...updates };
        setSurvey({ ...survey, questions: newQuestions });
    };

    const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
        if (!survey) return;

        const newQuestions = [...survey.questions];
        const options = [...(newQuestions[questionIndex].options || [])];
        options[optionIndex] = value;
        newQuestions[questionIndex] = { ...newQuestions[questionIndex], options };
        setSurvey({ ...survey, questions: newQuestions });
    };

    const addOption = (questionIndex: number) => {
        if (!survey) return;

        const newQuestions = [...survey.questions];
        const options = [...(newQuestions[questionIndex].options || []), '새 옵션'];
        newQuestions[questionIndex] = { ...newQuestions[questionIndex], options };
        setSurvey({ ...survey, questions: newQuestions });
    };

    const removeOption = (questionIndex: number, optionIndex: number) => {
        if (!survey) return;

        const newQuestions = [...survey.questions];
        const options = (newQuestions[questionIndex].options || []).filter((_, i) => i !== optionIndex);
        newQuestions[questionIndex] = { ...newQuestions[questionIndex], options };
        setSurvey({ ...survey, questions: newQuestions });
    };

    const deleteQuestion = (index: number) => {
        if (!survey) return;

        const newQuestions = survey.questions.filter((_, i) => i !== index);
        setSurvey({ ...survey, questions: newQuestions });
    };

    const addQuestion = () => {
        if (!survey) return;

        const newQuestion: Question = {
            id: `q${survey.questions.length + 1}`,
            type: 'single_choice',
            question: '새 질문을 입력하세요',
            options: ['옵션 1', '옵션 2'],
            required: false,
        };
        setSurvey({ ...survey, questions: [...survey.questions, newQuestion] });
    };

    const handlePublish = async () => {
        if (!survey) return;

        setIsSaving(true);
        setError(null);

        try {
            // Direct Firestore call
            await updateSurvey(id, {
                questions: survey.questions,
                status: 'published',
            });

            router.push(`/deploy/${id}`);
        } catch (err) {
            console.error('Save error:', err);
            setError('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f6f7f8] flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-3 text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#137fec] border-t-transparent"></div>
                        <span>설문을 불러오는 중...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !survey) {
        return (
            <div className="min-h-screen bg-[#f6f7f8] flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">{error}</p>
                        <button
                            onClick={() => router.push('/create')}
                            className="px-6 py-2 bg-[#137fec] text-white rounded-lg hover:bg-blue-600"
                        >
                            새 설문 만들기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f7f8] flex flex-col">
            <Header />

            <main className="flex-grow flex flex-col items-center w-full px-4 sm:px-6 pb-28">
                <div className="w-full max-w-[960px] flex flex-col pt-8 gap-6">
                    {/* Progress Bar */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                            <p className="text-[#137fec] font-bold text-sm">단계 2 / 3</p>
                            <p className="text-gray-500 text-sm font-medium">구조화 미리보기</p>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-[#137fec] w-2/3 rounded-full shadow-lg shadow-[#137fec]/20"></div>
                        </div>
                    </div>

                    {/* Page Heading */}
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
                            설문 구조화 미리보기
                        </h1>
                        <p className="text-gray-500 text-base sm:text-lg">
                            AI가 분석한 내용을 바탕으로 생성된 질문 초안입니다. 질문을 수정하거나 순서를 변경하세요.
                        </p>
                    </div>

                    {/* Context Source Card */}
                    <div className="rounded-xl overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-[#137fec] opacity-90 z-10"></div>
                        <div className="relative z-20 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex flex-col gap-1 text-white">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="material-symbols-outlined text-white/80 text-xl">description</span>
                                    <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white/90">
                                        분석 완료
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold leading-tight">{survey?.title}</h3>
                                <p className="text-white/80 text-sm font-medium max-w-xl">
                                    {survey?.questions.length}개의 질문이 생성되었습니다.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Question List */}
                    <div className="flex flex-col gap-6" id="question-list">
                        {survey?.questions.map((question, index) => (
                            <div
                                key={question.id}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group/card"
                            >
                                {/* Card Header */}
                                <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                                    <div className="cursor-grab text-gray-400 hover:text-gray-600">
                                        <span className="material-symbols-outlined">drag_indicator</span>
                                    </div>
                                    <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-sm">
                                        Q{index + 1}
                                    </span>
                                    <div className="relative ml-2 flex-1 sm:max-w-[200px]">
                                        <select
                                            value={question.type}
                                            onChange={(e) => updateQuestion(index, { type: e.target.value as QuestionType })}
                                            className="w-full bg-transparent border-0 text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer py-1 pl-0 pr-8"
                                        >
                                            {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                                                <option key={value} value={value}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => deleteQuestion(index)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            title="삭제"
                                        >
                                            <span className="material-symbols-outlined text-xl">delete</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-5 flex flex-col gap-4">
                                    <textarea
                                        value={question.question}
                                        onChange={(e) => updateQuestion(index, { question: e.target.value })}
                                        className="w-full text-lg font-medium text-gray-900 bg-transparent border-0 border-b-2 border-transparent focus:border-[#137fec] focus:ring-0 px-0 py-2 resize-none placeholder-gray-400 transition-colors"
                                        rows={2}
                                    />

                                    {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
                                        <div className="flex flex-col gap-3 pl-1">
                                            {question.options?.map((option, optionIndex) => (
                                                <div key={optionIndex} className="flex items-center gap-3 group/option">
                                                    <span className="material-symbols-outlined text-gray-400 text-xl">
                                                        {question.type === 'single_choice'
                                                            ? 'radio_button_unchecked'
                                                            : 'check_box_outline_blank'}
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                                        className="flex-1 bg-gray-50 border-0 rounded px-3 py-2 text-sm text-gray-800 focus:ring-1 focus:ring-[#137fec] placeholder-gray-400"
                                                    />
                                                    <button
                                                        onClick={() => removeOption(index, optionIndex)}
                                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover/option:opacity-100 transition-opacity"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">close</span>
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="material-symbols-outlined text-transparent text-xl">
                                                    radio_button_unchecked
                                                </span>
                                                <button
                                                    onClick={() => addOption(index)}
                                                    className="text-[#137fec] hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-lg">add</span>
                                                    옵션 추가
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {(question.type === 'text' || question.type === 'long_text') && (
                                        <div className="pl-1">
                                            <div
                                                className={`w-full ${question.type === 'long_text' ? 'h-24' : 'h-10'
                                                    } bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm`}
                                            >
                                                {question.type === 'long_text' ? '장문형 답변 입력 영역 (미리보기)' : '단답형 입력란'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Add New Button */}
                        <button
                            onClick={addQuestion}
                            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:border-[#137fec] hover:text-[#137fec] hover:bg-[#137fec]/5 transition-all"
                        >
                            <span className="material-symbols-outlined">add_circle</span>
                            <span className="font-medium">질문 직접 추가하기</span>
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                            {error}
                        </div>
                    )}
                </div>
            </main>

            {/* Fixed Footer */}
            <footer className="fixed bottom-0 w-full bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
                <div className="max-w-[960px] mx-auto px-6 py-4 flex justify-between items-center">
                    <button
                        onClick={() => router.push('/create')}
                        className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-900 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        이전
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePublish}
                            disabled={isSaving}
                            className="px-8 py-2.5 rounded-lg bg-[#137fec] hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    <span>저장 중...</span>
                                </>
                            ) : (
                                <>
                                    <span>설문 생성 완료</span>
                                    <span className="material-symbols-outlined text-lg">check</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
