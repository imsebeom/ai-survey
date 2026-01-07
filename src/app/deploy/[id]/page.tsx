'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import type { Survey } from '@/types';

interface DeployPageProps {
    params: Promise<{ id: string }>;
}

export default function DeployPage({ params }: DeployPageProps) {
    const { id } = use(params);
    const router = useRouter();

    const [survey, setSurvey] = useState<Survey | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState<'classic' | 'interview' | null>(null);

    const classicUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/survey/${id}`
        : `/survey/${id}`;

    const interviewUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/interview/${id}`
        : `/interview/${id}`;

    useEffect(() => {
        async function fetchSurvey() {
            try {
                const response = await fetch(`/api/surveys/${id}`);
                const data = await response.json();

                if (data.success && data.survey) {
                    setSurvey(data.survey);
                }
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchSurvey();
    }, [id]);

    const copyToClipboard = async (text: string, type: 'classic' | 'interview') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f6f7f8] flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-3 text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#137fec] border-t-transparent"></div>
                        <span>불러오는 중...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f7f8] flex flex-col">
            <Header />

            <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                <div className="mx-auto max-w-5xl flex flex-col gap-8 pb-10">
                    {/* Success State */}
                    <div className="flex flex-col items-center text-center gap-4 py-8">
                        <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                            <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                            설문이 성공적으로 생성되었습니다!
                        </h1>
                        <p className="text-lg text-gray-500 max-w-2xl">
                            이제 학생들에게 설문을 배포할 준비가 되었습니다.
                            <br className="hidden sm:block" />
                            원하는 배포 방식의 링크를 복사하여 메신저나 LMS에 공유하세요.
                        </p>
                    </div>

                    <div className="h-px w-full bg-gray-200"></div>

                    {/* Mode Selection */}
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#137fec]">share</span>
                                배포 모드 선택
                            </h2>
                            <span className="text-sm text-gray-500 hidden sm:inline-block">
                                두 가지 모드를 동시에 사용할 수 있습니다.
                            </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Classic Mode Card */}
                            <div className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:border-[#137fec]/50 hover:shadow-md transition-all flex flex-col overflow-hidden">
                                <div className="h-40 bg-gray-100 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-50"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="relative size-20 bg-white rounded-lg shadow-lg rotate-[-6deg] group-hover:rotate-[-3deg] transition-transform duration-500 flex flex-col p-2 gap-2">
                                            <div className="h-2 w-12 bg-gray-200 rounded"></div>
                                            <div className="h-2 w-full bg-gray-200 rounded"></div>
                                            <div className="h-2 w-10 bg-gray-200 rounded"></div>
                                            <div className="mt-auto self-end size-4 rounded-full bg-blue-400"></div>
                                        </div>
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">Classic</span>
                                    </div>
                                </div>

                                <div className="p-6 flex flex-col gap-4 flex-1">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">클래식 모드</h3>
                                        <p className="text-sm text-gray-500">전통적인 설문지 형태입니다. 학생들이 페이지를 넘기며 정해진 문항에 답변을 입력합니다.</p>
                                    </div>

                                    <div className="mt-auto space-y-3">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">배포용 링크</label>
                                        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                                            <div className="flex-1 px-2 py-1 overflow-hidden">
                                                <p className="text-sm text-gray-600 truncate font-mono select-all">{classicUrl}</p>
                                            </div>
                                            <button onClick={() => copyToClipboard(classicUrl, 'classic')} className="p-2 text-[#137fec] hover:bg-[#137fec]/10 rounded-md transition-colors" title="Copy URL">
                                                <span className="material-symbols-outlined text-[20px]">content_copy</span>
                                            </button>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button onClick={() => copyToClipboard(classicUrl, 'classic')} className="flex-1 bg-[#137fec] hover:bg-blue-600 text-white h-10 px-4 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                                {copied === 'classic' ? '복사됨!' : '링크 복사'}
                                            </button>
                                            <button onClick={() => window.open(`/survey/${id}`, '_blank')} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 h-10 px-4 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                미리보기
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Interview Mode Card */}
                            <div className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:border-[#137fec]/50 hover:shadow-md transition-all flex flex-col overflow-hidden relative">
                                <div className="absolute top-4 right-4 z-10">
                                    <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">AI Powered</span>
                                </div>

                                <div className="h-40 bg-gray-100 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-100 opacity-50"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="flex gap-2 items-end">
                                            <div className="size-10 bg-white rounded-tl-xl rounded-tr-xl rounded-br-xl shadow-lg flex items-center justify-center group-hover:-translate-y-1 transition-transform duration-500 delay-75">
                                                <span className="material-symbols-outlined text-gray-400 text-lg">smart_toy</span>
                                            </div>
                                            <div className="size-12 bg-[#137fec] rounded-tl-xl rounded-tr-xl rounded-bl-xl shadow-lg flex items-center justify-center mb-4 group-hover:-translate-y-1 transition-transform duration-500">
                                                <span className="material-symbols-outlined text-white text-xl">chat_bubble</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-full">Interview</span>
                                    </div>
                                </div>

                                <div className="p-6 flex flex-col gap-4 flex-1">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">인터뷰 모드</h3>
                                        <p className="text-sm text-gray-500">AI 튜터가 학생과 1:1 대화를 나누며 응답을 수집합니다. 더 깊이 있는 의견을 들을 수 있습니다.</p>
                                    </div>

                                    <div className="mt-auto space-y-3">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">배포용 링크</label>
                                        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                                            <div className="flex-1 px-2 py-1 overflow-hidden">
                                                <p className="text-sm text-gray-600 truncate font-mono select-all">{interviewUrl}</p>
                                            </div>
                                            <button onClick={() => copyToClipboard(interviewUrl, 'interview')} className="p-2 text-[#137fec] hover:bg-[#137fec]/10 rounded-md transition-colors" title="Copy URL">
                                                <span className="material-symbols-outlined text-[20px]">content_copy</span>
                                            </button>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button onClick={() => copyToClipboard(interviewUrl, 'interview')} className="flex-1 bg-[#137fec] hover:bg-blue-600 text-white h-10 px-4 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                                {copied === 'interview' ? '복사됨!' : '링크 복사'}
                                            </button>
                                            <button onClick={() => window.open(`/interview/${id}`, '_blank')} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 h-10 px-4 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                미리보기
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Bottom Actions */}
                    <div className="flex justify-end gap-4 pt-4">
                        <button onClick={() => router.push(`/preview/${id}`)} className="text-gray-600 font-medium text-sm hover:underline px-4 py-2">설문 수정하기</button>
                        <button onClick={() => router.push(`/dashboard/${id}`)} className="bg-gray-900 text-white rounded-lg px-6 py-2.5 text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2">
                            결과 대시보드
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
