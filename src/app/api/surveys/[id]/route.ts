import { NextRequest, NextResponse } from 'next/server';
import { getSurvey, updateSurvey, deleteSurvey } from '@/lib/firebase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const survey = await getSurvey(id);

        if (!survey) {
            return NextResponse.json(
                { success: false, error: '설문을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, survey });
    } catch (error) {
        console.error('Get survey error:', error);
        return NextResponse.json(
            { success: false, error: '설문 조회 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const updates = await request.json();

        await updateSurvey(id, updates);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update survey error:', error);
        return NextResponse.json(
            { success: false, error: '설문 수정 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await deleteSurvey(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete survey error:', error);
        return NextResponse.json(
            { success: false, error: '설문 삭제 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
