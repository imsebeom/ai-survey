'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import type { Survey, ChatMessage } from '@/types';

interface InterviewPageProps {
    params: Promise<{ id: string }>;
}

export default function InterviewPage({ params }: InterviewPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const chatEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [survey, setSurvey] = useState<Survey | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch survey and start conversation
    useEffect(() => {
        async function initializeInterview() {
            try {
                const response = await fetch(`/api/surveys/${id}`);
                const data = await response.json();

                if (!data.success || !data.survey) {
                    setError('설문을 찾을 수 없습니다.');
                    setIsLoading(false);
                    return;
                }

                setSurvey(data.survey);

                // Start with AI greeting
                const greeting: ChatMessage = {
                    role: 'assistant',
                    content: `안녕하세요! 👋\n\n저는 AI 인터뷰 챗봇입니다. "${data.survey.title}" 설문을 대화 형식으로 진행할게요.\n\n편하게 답변해주시면 됩니다. 준비되셨으면 아무 말이나 해주세요!`,
                    timestamp: new Date(),
                };

                setMessages([greeting]);
                setIsLoading(false);
            } catch (err) {
                console.error('Initialize error:', err);
                setError('설문을 불러오는 중 오류가 발생했습니다.');
                setIsLoading(false);
            }
        }

        initializeInterview();
    }, [id]);

    // Focus input when sending is complete
    useEffect(() => {
        if (!isSending && !isCompleted) {
            // Small timeout to ensure DOM is ready and prevent scroll jumping
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 50);
        }
    }, [isSending, isCompleted]);

    const sendMessage = async () => {
        if (!input.trim() || isSending || !survey) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsSending(true);

        // Save answer for current question
        if (currentQuestionIndex < survey.questions.length) {
            const currentQuestion = survey.questions[currentQuestionIndex];
            setAnswers(prev => ({
                ...prev,
                [currentQuestion.id]: userMessage.content,
            }));
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    surveyId: id,
                    messages: [...messages, userMessage],
                    currentQuestionIndex,
                }),
            });

            const data = await response.json();

            if (data.success) {
                const assistantMessage: ChatMessage = {
                    role: 'assistant',
                    content: data.message,
                    timestamp: new Date(),
                };

                setMessages(prev => [...prev, assistantMessage]);
                setCurrentQuestionIndex(data.nextQuestionIndex);
                setIsCompleted(data.isCompleted);

                // If completed, submit responses
                if (data.isCompleted) {
                    await submitResponses();
                }
            } else {
                setError(data.error || '응답 생성 중 오류가 발생했습니다.');
            }
        } catch (err) {
            console.error('Send error:', err);
            setError('메시지 전송 중 오류가 발생했습니다.');
        } finally {
            setIsSending(false);
        }
    };

    const submitResponses = async () => {
        try {
            await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    surveyId: id,
                    answers,
                    respondentType: survey?.target,
                    interviewLog: messages,
                }),
            });
        } catch (err) {
            console.error('Submit error:', err);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const progress = survey
        ? Math.round((currentQuestionIndex / survey.questions.length) * 100)
        : 0;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#137fec] border-t-transparent"></div>
                    <span>인터뷰를 준비하는 중...</span>
                </div>
            </div>
        );
    }

    if (error && !survey) {
        return (
            <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 bg-[#137fec] text-white rounded-lg hover:bg-blue-600"
                    >
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#f6f7f8] flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex-none bg-white border-b border-gray-200 px-6 py-3 z-10">
                <div className="max-w-[960px] mx-auto w-full flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-gray-900">
                            <div className="size-8 flex items-center justify-center rounded-lg bg-[#137fec]/10 text-[#137fec]">
                                <span className="material-symbols-outlined text-2xl">chat_bubble</span>
                            </div>
                            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">AI 설문 마법사</h2>
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center justify-center rounded-lg size-10 bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl font-bold leading-tight text-gray-900">{survey?.title}</h1>
                            <p className="text-gray-500 text-sm">AI 튜터와의 대화를 통해 설문을 진행해주세요.</p>
                        </div>
                        <div className="flex flex-col gap-2 min-w-[200px]">
                            <div className="flex gap-4 justify-between items-center">
                                <p className="text-gray-900 text-xs font-medium">설문 진행률</p>
                                <p className="text-[#137fec] text-xs font-bold">{progress}%</p>
                            </div>
                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#137fec] rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-hidden relative w-full flex flex-col items-center">
                <div className="w-full h-full max-w-[960px] flex flex-col">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 md:px-10 py-6 flex flex-col gap-4">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex items-end gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                            >
                                {message.role === 'assistant' && (
                                    <div className="size-10 rounded-full bg-gradient-to-br from-[#137fec] to-blue-600 flex items-center justify-center text-white shrink-0">
                                        <span className="material-symbols-outlined">smart_toy</span>
                                    </div>
                                )}
                                <div className={`flex flex-col gap-1 max-w-[85%] md:max-w-[70%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <span className="text-gray-500 text-xs px-1">
                                        {message.role === 'user' ? '나' : 'AI 튜터'}
                                    </span>
                                    <div
                                        className={`p-4 rounded-2xl shadow-sm whitespace-pre-wrap ${message.role === 'user'
                                            ? 'bg-[#137fec] text-white rounded-br-none'
                                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                                            }`}
                                    >
                                        <p className="text-base leading-relaxed">{message.content}</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isSending && (
                            <div className="flex items-end gap-3">
                                <div className="size-10 rounded-full bg-gradient-to-br from-[#137fec] to-blue-600 flex items-center justify-center text-white shrink-0">
                                    <span className="material-symbols-outlined">smart_toy</span>
                                </div>
                                <div className="px-4 py-3 bg-white border border-gray-200 rounded-2xl rounded-bl-none shadow-sm flex gap-1 items-center">
                                    <div className="size-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="size-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="size-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        )}

                        {/* Completion Message */}
                        {isCompleted && (
                            <div className="flex justify-center py-4">
                                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center max-w-md">
                                    <span className="material-symbols-outlined text-green-600 text-4xl mb-2">check_circle</span>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">설문 완료!</h3>
                                    <p className="text-gray-500 text-sm mb-4">참여해주셔서 감사합니다.</p>
                                    <button
                                        onClick={() => router.push('/')}
                                        className="px-6 py-2 bg-[#137fec] text-white rounded-lg hover:bg-blue-600"
                                    >
                                        홈으로 돌아가기
                                    </button>
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef}></div>
                    </div>

                    {/* Input Area */}
                    {!isCompleted && (
                        <div className="flex-none p-4 md:px-10 md:pb-8 bg-[#f6f7f8]">
                            <div className="relative bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col gap-2 p-2">
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="답변을 입력해주세요..."
                                    disabled={isSending}
                                    className="w-full bg-transparent border-none focus:ring-0 p-3 min-h-[60px] max-h-[150px] resize-none text-gray-900 placeholder-gray-400 disabled:opacity-50"
                                />
                                <div className="flex justify-between items-center px-2 pb-1">
                                    <div className="text-gray-400 text-xs">
                                        Enter로 전송, Shift+Enter로 줄바꿈
                                    </div>
                                    <button
                                        onClick={sendMessage}
                                        disabled={!input.trim() || isSending}
                                        className="flex items-center gap-2 bg-[#137fec] hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm disabled:cursor-not-allowed"
                                    >
                                        <span>보내기</span>
                                        <span className="material-symbols-outlined text-[18px]">send</span>
                                    </button>
                                </div>
                            </div>
                            <div className="text-center mt-3">
                                <p className="text-[11px] text-gray-400">AI는 실수할 수 있습니다. 중요한 정보는 확인해주세요.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
