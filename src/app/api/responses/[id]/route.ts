import { NextRequest, NextResponse } from 'next/server';
import { getResponsesBySurvey } from '@/lib/firebase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const responses = await getResponsesBySurvey(id);

        return NextResponse.json({
            success: true,
            responses,
            count: responses.length,
        });
    } catch (error) {
        console.error('Get responses error:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        return NextResponse.json(
            { success: false, error: `응답 조회 오류: ${errorMessage}` },
            { status: 500 }
        );
    }
}
