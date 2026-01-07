import { NextRequest, NextResponse } from 'next/server';
import { generateSurveyFromText } from '@/lib/gemini';
import { createSurvey } from '@/lib/firebase';
import type { SurveyTarget, SurveyMode } from '@/types';

export async function POST(request: NextRequest) {
    try {
        // Check if Gemini API key is configured
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'Gemini API 키가 설정되지 않았습니다. .env.local 파일을 확인하세요.' },
                { status: 500 }
            );
        }

        const formData = await request.formData();

        const target = formData.get('target') as SurveyTarget;
        const mode = formData.get('mode') as SurveyMode;
        const prompt = formData.get('prompt') as string | null;
        const text = formData.get('text') as string | null;

        if (!target || !mode) {
            return NextResponse.json(
                { success: false, error: '대상과 모드를 선택해주세요.' },
                { status: 400 }
            );
        }

        // Text-based generation only
        let combinedText = '';

        if (text) {
            combinedText += text;
        }

        const generatedSurvey = await generateSurveyFromText({
            target,
            mode,
            text: combinedText || undefined,
            prompt: prompt || undefined,
        });

        // Save to Firebase
        const surveyId = await createSurvey({
            title: generatedSurvey.title,
            description: generatedSurvey.description,
            target,
            mode,
            questions: generatedSurvey.questions,
            ...(prompt ? { sourcePrompt: prompt } : {}),
            createdAt: new Date(),
            status: 'draft',
        });

        return NextResponse.json({
            success: true,
            surveyId,
            survey: generatedSurvey,
        });
    } catch (error) {
        console.error('Survey generation error:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        return NextResponse.json(
            { success: false, error: `설문 생성 오류: ${errorMessage}` },
            { status: 500 }
        );
    }
}
