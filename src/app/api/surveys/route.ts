import { NextResponse } from 'next/server';
import { getAllSurveys } from '@/lib/firebase';

export async function GET() {
    try {
        const surveys = await getAllSurveys();

        return NextResponse.json({
            success: true,
            surveys,
        });
    } catch (error) {
        console.error('Get surveys error:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        return NextResponse.json(
            { success: false, error: `설문 목록 조회 오류: ${errorMessage}` },
            { status: 500 }
        );
    }
}
