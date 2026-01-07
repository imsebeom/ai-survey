import { NextRequest, NextResponse } from 'next/server';
import { createResponse } from '@/lib/firebase';
import type { SurveyTarget } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { surveyId, answers, respondentType } = body;

        if (!surveyId || !answers) {
            return NextResponse.json(
                { success: false, error: '필수 정보가 누락되었습니다.' },
                { status: 400 }
            );
        }

        const responseId = await createResponse({
            surveyId,
            respondentType: (respondentType as SurveyTarget) || 'student',
            answers,
            submittedAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            responseId,
        });
    } catch (error) {
        console.error('Submit response error:', error);
        return NextResponse.json(
            { success: false, error: '응답 제출 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
