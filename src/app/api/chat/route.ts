import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSurvey } from '@/lib/firebase';
import type { ChatMessage } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface ChatRequest {
    surveyId: string;
    messages: ChatMessage[];
    currentQuestionIndex?: number;
}

export async function POST(request: NextRequest) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'Gemini API 키가 설정되지 않았습니다.' },
                { status: 500 }
            );
        }

        const body: ChatRequest = await request.json();
        const { surveyId, messages, currentQuestionIndex = 0 } = body;

        if (!surveyId) {
            return NextResponse.json(
                { success: false, error: 'surveyId가 필요합니다.' },
                { status: 400 }
            );
        }

        // Fetch survey
        const survey = await getSurvey(surveyId);
        if (!survey) {
            return NextResponse.json(
                { success: false, error: '설문을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        const questions = survey.questions;
        const currentQuestion = questions[currentQuestionIndex];
        const isCompleted = currentQuestionIndex >= questions.length;

        // Build conversation context
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

        const systemPrompt = `당신은 친절한 AI 튜터입니다. 설문 조사를 대화 형식으로 진행하고 있습니다.

설문 제목: ${survey.title}
${survey.description ? `설문 설명: ${survey.description}` : ''}

현재 진행 상황: ${currentQuestionIndex + 1}/${questions.length} 질문

당신의 역할:
1. 사용자의 응답에 대해 간단히 공감하거나 반응해주세요 (1-2문장)
2. ${isCompleted ? '설문이 완료되었음을 알리고 참여에 감사드리세요.' : `다음 질문을 자연스럽게 이어서 물어보세요: "${currentQuestion?.question}"`}
3. 대화체로 자연스럽게 말해주세요
4. 이모지를 적절히 사용해주세요

${!isCompleted && currentQuestion?.options ? `
현재 질문의 선택지:
${currentQuestion.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}

선택지가 있는 질문이지만, 사용자가 자유롭게 답하도록 허용해주세요.
` : ''}

응답은 반드시 한국어로 해주세요.`;

        // Generate response using simple generateContent instead of chat
        const lastUserMessage = messages && messages.length > 0
            ? messages[messages.length - 1]?.content || '안녕하세요'
            : '안녕하세요';

        const result = await model.generateContent(`${systemPrompt}\n\n사용자 응답: ${lastUserMessage}`);
        const assistantMessage = result.response.text();

        return NextResponse.json({
            success: true,
            message: assistantMessage,
            isCompleted,
            nextQuestionIndex: isCompleted ? currentQuestionIndex : currentQuestionIndex + 1,
            currentQuestion: currentQuestion || null,
            totalQuestions: questions.length,
        });
    } catch (error) {
        console.error('Chat error:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        return NextResponse.json(
            { success: false, error: `채팅 오류: ${errorMessage}` },
            { status: 500 }
        );
    }
}
