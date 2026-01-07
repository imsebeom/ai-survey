'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import type { Survey } from '@/types';
import { TARGET_LABELS } from '@/types';

export default function HomePage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSurveys() {
      try {
        const response = await fetch('/api/surveys');
        const data = await response.json();

        if (data.success) {
          setSurveys(data.surveys);
        }
      } catch (err) {
        console.error('Fetch surveys error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSurveys();
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f7f8] flex flex-col">
      <Header />

      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#137fec]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-3xl"></div>
      </div>

      <main className="flex-grow flex flex-col items-center py-8 px-4 sm:px-6 w-full">
        <div className="w-full max-w-[1200px] flex flex-col gap-8">
          {/* Hero Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                AI 설문 마법사
              </h1>
              <p className="text-gray-500 mt-2">
                AI가 설문을 분석하고 구조화해드립니다
              </p>
            </div>
            <Link
              href="/create"
              className="h-12 px-6 bg-[#137fec] hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined">add</span>
              <span className="font-bold">새 설문 만들기</span>
            </Link>
          </div>

          {/* Surveys List */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#137fec]">folder_open</span>
                내 설문 목록
              </h2>
              <span className="text-sm text-gray-500">
                {surveys.length}개의 설문
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#137fec] border-t-transparent"></div>
                  <span>불러오는 중...</span>
                </div>
              </div>
            ) : surveys.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">inbox</span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">아직 설문이 없습니다</h3>
                <p className="text-gray-500 mb-6">새 설문을 만들어 시작하세요!</p>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-[#137fec] text-white rounded-lg hover:bg-blue-600"
                >
                  <span className="material-symbols-outlined">add</span>
                  설문 만들기
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {surveys.map((survey) => (
                  <div
                    key={survey.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                  >
                    <div className="p-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${survey.status === 'published'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                              }`}>
                              {survey.status === 'published' ? '배포됨' : '초안'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                              {TARGET_LABELS[survey.target]}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-[#137fec] transition-colors">
                            {survey.title}
                          </h3>
                        </div>
                      </div>

                      {survey.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {survey.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        <span>{new Date(survey.createdAt).toLocaleDateString('ko-KR')}</span>
                        <span>•</span>
                        <span>{survey.questions.length}개 질문</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50 flex gap-2">
                      <Link
                        href={`/dashboard/${survey.id}`}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium text-[#137fec] hover:bg-[#137fec]/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">analytics</span>
                        결과 보기
                      </Link>
                      <Link
                        href={`/preview/${survey.id}`}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        수정
                      </Link>
                      <Link
                        href={`/deploy/${survey.id}`}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">share</span>
                        공유
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-[1200px] mx-auto px-4 text-center text-gray-400 text-sm">
          © 2024 AI 설문 마법사. Powered by Gemini AI.
        </div>
      </footer>
    </div>
  );
}
