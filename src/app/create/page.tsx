'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import type { SurveyTarget } from '@/types';
import { generateSurveyFromText } from '@/lib/gemini';
import { createSurvey } from '@/lib/firebase';
import { TARGET_LABELS } from '@/types';

export default function CreateSurveyPage() {
    const router = useRouter();

    // Form state
    const [target, setTarget] = useState<SurveyTarget>('student');
    const [text, setText] = useState('');
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Submit handler
    const handleSubmit = async () => {
        if (!text && !prompt) {
            setError('설문 내용 또는 AI 프롬프트를 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Generate survey content using Vertex AI (Client-side)
            console.log('Generating survey...');
            const generatedSurvey = await generateSurveyFromText({
                target,
                mode: 'classic', // TODO: Make this selectable if needed
                text: text || undefined,
                prompt: prompt || undefined,
            });
            console.log('Survey generated:', generatedSurvey);

            // 2. Save to Firestore (Client-side)
            console.log('Saving to Firestore...');
            const surveyId = await createSurvey({
                title: generatedSurvey.title,
                description: generatedSurvey.description,
                target,
                mode: 'classic',
                questions: generatedSurvey.questions,
                ...(prompt ? { sourcePrompt: prompt } : {}),
                createdAt: new Date(),
                status: 'draft',
            });
            console.log('Saved to Firestore. ID:', surveyId);

            console.log('Navigating to preview...');
            router.push(`/preview/${surveyId}`);

        } catch (err) {
            console.error('Submit error:', err);
            const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
            setError(`설문 생성 중 오류가 발생했습니다: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f6f7f8] flex flex-col">
            <Header />

            {/* Background decoration */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#137fec]/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-3xl"></div>
            </div>

            <main className="flex-grow flex flex-col items-center py-8 px-4 sm:px-6 w-full">
                <div className="w-full max-w-[960px] flex flex-col gap-6">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2">
                        <a className="text-gray-500 text-sm font-medium hover:text-[#137fec]" href="/">
                            홈
                        </a>
                        <span className="material-symbols-outlined text-gray-400 text-base">chevron_right</span>
                        <span className="text-gray-900 text-sm font-medium">설문 생성</span>
                    </div>

                    {/* Page Heading */}
                    <div className="flex flex-col gap-3">
                        <h1 className="text-gray-900 text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">
                            새로운 설문 만들기
                        </h1>
                        <p className="text-gray-500 text-base sm:text-lg font-normal leading-relaxed max-w-2xl">
                            AI가 설문 초안을 작성할 수 있도록 수업 자료나 요약 내용을 제공해주세요.
                        </p>
                    </div>

                    {/* Target Selection */}
                    <div className="flex flex-col gap-3">
                        <label className="text-sm font-bold text-gray-900">대상 선택</label>
                        <div className="flex gap-3 flex-wrap">
                            {(['student', 'teacher', 'parent'] as SurveyTarget[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTarget(t)}
                                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${target === t
                                        ? 'bg-[#137fec] text-white shadow-md shadow-blue-500/20'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:border-[#137fec] hover:text-[#137fec]'
                                        }`}
                                >
                                    {TARGET_LABELS[t]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="p-6 sm:p-10 flex flex-col gap-8 min-h-[300px]">

                            <div className="flex flex-col gap-4">
                                <label className="text-sm font-bold text-gray-900">
                                    설문 내용 직접 입력
                                </label>
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="설문 내용을 직접 입력하세요. 예: 학교생활 만족도 조사, 급식 만족도, 학교 시설에 대한 의견..."
                                    className="w-full min-h-[200px] p-4 rounded-lg border border-gray-300 focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] resize-y text-gray-900 placeholder-gray-400"
                                />
                            </div>

                            {/* AI Prompt Section (always visible) */}
                            <div className="flex flex-col gap-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#137fec]">auto_awesome</span>
                                    <label className="text-sm font-bold text-gray-900">
                                        AI 프롬프트 (선택사항)
                                    </label>
                                </div>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="AI에게 추가 지시사항을 입력하세요. 예: '5지 선다형 위주로 만들어줘', '질문을 10개로 만들어줘'..."
                                    className="w-full min-h-[100px] p-4 rounded-lg border border-gray-300 focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] resize-y text-gray-900 placeholder-gray-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Sticky Action Bar */}
                    <div className="sticky bottom-4 z-40">
                        <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-200 flex items-center justify-between gap-4">
                            <div className="hidden sm:flex flex-col">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Estimated Time
                                </span>
                                <span className="text-sm font-bold text-gray-900">~15 초 소요</span>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                <button
                                    onClick={() => router.push('/')}
                                    className="h-12 px-6 rounded-lg border border-transparent text-gray-600 font-bold text-sm hover:bg-gray-100 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="h-12 px-8 rounded-lg bg-[#137fec] hover:bg-blue-600 text-white shadow-md shadow-[#137fec]/20 flex items-center justify-center gap-2 transition-all w-full sm:w-auto transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            <span className="font-bold text-sm">생성 중...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="font-bold text-sm">다음 단계 (초안 생성)</span>
                                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
