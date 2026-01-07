'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import type { Survey, SurveyResponse, Question } from '@/types';
import { TARGET_LABELS } from '@/types';

interface DashboardPageProps {
    params: Promise<{ id: string }>;
}

interface QuestionStats {
    questionId: string;
    questionText: string;
    type: string;
    options?: { option: string; count: number; percentage: number }[];
    textResponses?: string[];
}

export default function DashboardPage({ params }: DashboardPageProps) {
    const { id } = use(params);
    const router = useRouter();

    const [survey, setSurvey] = useState<Survey | null>(null);
    const [responses, setResponses] = useState<SurveyResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch survey
                const surveyRes = await fetch(`/api/surveys/${id}`);
                const surveyData = await surveyRes.json();

                if (!surveyData.success) {
                    setError(surveyData.error || '설문을 찾을 수 없습니다.');
                    setIsLoading(false);
                    return;
                }

                setSurvey(surveyData.survey);

                // Fetch responses
                const responsesRes = await fetch(`/api/responses/${id}`);
                const responsesData = await responsesRes.json();

                if (responsesData.success) {
                    setResponses(responsesData.responses);
                }
            } catch (err) {
                console.error('Fetch error:', err);
                setError('데이터를 불러오는 중 오류가 발생했습니다.');
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [id]);

    // Calculate stats for each question
    const calculateQuestionStats = (): QuestionStats[] => {
        if (!survey || responses.length === 0) return [];

        return survey.questions.map((question) => {
            const stats: QuestionStats = {
                questionId: question.id,
                questionText: question.question,
                type: question.type,
            };

            if (question.type === 'single_choice' || question.type === 'multiple_choice') {
                const optionCounts: Record<string, number> = {};

                // Initialize counts
                question.options?.forEach(opt => {
                    optionCounts[opt] = 0;
                });

                // Count responses
                responses.forEach(response => {
                    const answer = response.answers[question.id];
                    if (Array.isArray(answer)) {
                        answer.forEach(a => {
                            if (optionCounts[a] !== undefined) optionCounts[a]++;
                        });
                    } else if (answer && optionCounts[answer] !== undefined) {
                        optionCounts[answer]++;
                    }
                });

                const totalResponses = question.type === 'multiple_choice'
                    ? Object.values(optionCounts).reduce((a, b) => a + b, 0) || 1
                    : responses.length || 1;

                stats.options = Object.entries(optionCounts).map(([option, count]) => ({
                    option,
                    count,
                    percentage: Math.round((count / (question.type === 'multiple_choice' ? responses.length : totalResponses)) * 100),
                }));
            } else {
                // Text responses
                stats.textResponses = responses
                    .map(r => r.answers[question.id] as string)
                    .filter(a => a && a.trim() !== '');
            }

            return stats;
        });
    };

    const questionStats = calculateQuestionStats();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f6f7f8] flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-3 text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#137fec] border-t-transparent"></div>
                        <span>데이터를 불러오는 중...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !survey) {
        return (
            <div className="min-h-screen bg-[#f6f7f8] flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">{error || '설문을 찾을 수 없습니다.'}</p>
                        <button
                            onClick={() => router.push('/')}
                            className="px-6 py-2 bg-[#137fec] text-white rounded-lg hover:bg-blue-600"
                        >
                            홈으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const responseRate = survey ? Math.round((responses.length / Math.max(responses.length, 1)) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#f6f7f8] flex flex-col">
            <Header />

            <main className="flex-1 p-6 xl:p-10 max-w-[1400px] mx-auto w-full">
                <div className="flex flex-col gap-6">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${survey.status === 'published'
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                    }`}>
                                    {survey.status === 'published' ? '진행 중' : '초안'}
                                </span>
                                <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                                    {survey.title}
                                </h1>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <span className="material-symbols-outlined text-lg">calendar_today</span>
                                <p>생성일: {new Date(survey.createdAt).toLocaleDateString('ko-KR')}</p>
                                <span className="mx-1">•</span>
                                <p>대상: {TARGET_LABELS[survey.target]}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => router.push(`/survey/${id}`)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <span className="material-symbols-outlined text-lg">visibility</span>
                                <span>설문 보기</span>
                            </button>
                            <button
                                onClick={() => router.push(`/deploy/${id}`)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#137fec] text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-sm"
                            >
                                <span className="material-symbols-outlined text-lg">share</span>
                                <span>공유하기</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1 p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start">
                                <p className="text-gray-500 text-sm font-medium">총 응답</p>
                                <span className="material-symbols-outlined text-[#137fec] bg-[#137fec]/10 p-1.5 rounded-lg text-xl">group</span>
                            </div>
                            <div className="flex items-end gap-2 mt-1">
                                <p className="text-3xl font-bold text-gray-900">{responses.length}<span className="text-lg font-medium text-gray-500 ml-1">명</span></p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start">
                                <p className="text-gray-500 text-sm font-medium">질문 수</p>
                                <span className="material-symbols-outlined text-purple-500 bg-purple-500/10 p-1.5 rounded-lg text-xl">quiz</span>
                            </div>
                            <div className="flex items-end gap-2 mt-1">
                                <p className="text-3xl font-bold text-gray-900">{survey.questions.length}<span className="text-lg font-medium text-gray-500 ml-1">개</span></p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start">
                                <p className="text-gray-500 text-sm font-medium">설문 모드</p>
                                <span className="material-symbols-outlined text-orange-500 bg-orange-500/10 p-1.5 rounded-lg text-xl">list_alt</span>
                            </div>
                            <div className="flex items-end gap-2 mt-1">
                                <p className="text-3xl font-bold text-gray-900">{survey.mode === 'classic' ? '클래식' : '인터뷰'}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start">
                                <p className="text-gray-500 text-sm font-medium">상태</p>
                                <span className="material-symbols-outlined text-green-500 bg-green-500/10 p-1.5 rounded-lg text-xl">check_circle</span>
                            </div>
                            <div className="flex items-end gap-2 mt-1">
                                <p className="text-3xl font-bold text-gray-900">{survey.status === 'published' ? '배포됨' : '초안'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Question Results */}
                    <div className="flex flex-col gap-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#137fec]">analytics</span>
                            질문별 응답 결과
                        </h2>

                        {responses.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">inbox</span>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">아직 응답이 없습니다</h3>
                                <p className="text-gray-500 mb-6">설문을 공유하여 응답을 수집하세요.</p>
                                <button
                                    onClick={() => router.push(`/deploy/${id}`)}
                                    className="px-6 py-2 bg-[#137fec] text-white rounded-lg hover:bg-blue-600"
                                >
                                    설문 공유하기
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {questionStats.map((stat, index) => (
                                    <div key={stat.questionId} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                        <div className="flex items-start gap-3 mb-4">
                                            <span className="bg-[#137fec]/10 text-[#137fec] text-sm font-bold px-2 py-1 rounded">
                                                Q{index + 1}
                                            </span>
                                            <h3 className="text-base font-bold text-gray-900 leading-snug">
                                                {stat.questionText}
                                            </h3>
                                        </div>

                                        {stat.options ? (
                                            <div className="flex flex-col gap-3">
                                                {stat.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className="flex flex-col gap-1">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-700">{opt.option}</span>
                                                            <span className="font-medium text-gray-900">{opt.count}명 ({opt.percentage}%)</span>
                                                        </div>
                                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-[#137fec] rounded-full transition-all duration-500"
                                                                style={{ width: `${opt.percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                                                {stat.textResponses?.length ? (
                                                    stat.textResponses.map((text, textIdx) => (
                                                        <div key={textIdx} className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                                                            "{text}"
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-gray-400 text-sm">텍스트 응답 없음</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
