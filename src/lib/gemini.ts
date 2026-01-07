import { getGenerativeModel } from 'firebase/vertexai-preview';
import { vertexAI } from '@/lib/firebase';
import type { Question, SurveyTarget, SurveyMode } from '@/types';

const TARGET_DESCRIPTIONS: Record<SurveyTarget, string> = {
    student: '초중고 학생',
    teacher: '교사',
    parent: '학부모',
};

const MODE_DESCRIPTIONS: Record<SurveyMode, string> = {
    classic: '일반 설문 형식 (객관식, 주관식 문항으로 구성)',
    interview: '인터뷰 형식 (대화형으로 질문하고 답변을 받는 형식)',
};

export interface GeneratedSurvey {
    title: string;
    description: string;
    questions: Question[];
}

export async function generateSurveyFromText(params: {
    target: SurveyTarget;
    mode: SurveyMode;
    text?: string;
    prompt?: string;
}): Promise<GeneratedSurvey> {
    const { target, mode, text, prompt } = params;

    const model = getGenerativeModel(vertexAI, { model: 'gemini-1.5-flash' });

    const systemPrompt = `당신은 교육용 설문지를 전문적으로 만드는 AI 어시스턴트입니다.
주어진 내용을 분석하여 설문 문항을 생성해주세요.

대상: ${TARGET_DESCRIPTIONS[target]}
형식: ${MODE_DESCRIPTIONS[mode]}

다음 JSON 형식으로만 응답해주세요:
{
  "title": "설문 제목",
  "description": "설문 설명",
  "questions": [
    {
      "id": "q1",
      "type": "single_choice | multiple_choice | text | long_text",
      "question": "질문 내용",
      "options": ["선택지1", "선택지2"] // 객관식일 경우만
    }
  ]
}

문항 유형:
- single_choice: 단일 선택 객관식
- multiple_choice: 복수 선택 객관식
- text: 단답형
- long_text: 장문형

설문은 5-10개 문항으로 구성해주세요.
${mode === 'interview' ? '인터뷰 모드이므로 개방형 질문(text, long_text)을 많이 포함해주세요.' : ''}`;

    const userContent = [];

    if (text) {
        userContent.push(`분석할 내용:\n${text}`);
    }

    if (prompt) {
        userContent.push(`추가 요청사항:\n${prompt}`);
    }

    if (userContent.length === 0) {
        userContent.push('일반적인 만족도 조사 설문을 만들어주세요.');
    }

    const result = await model.generateContent([
        { text: systemPrompt },
        { text: userContent.join('\n\n') },
    ]);

    const response = result.response.text();

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Failed to parse survey response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as GeneratedSurvey;

    // Ensure all questions have required fields
    parsed.questions = parsed.questions.map((q, idx) => ({
        ...q,
        id: q.id || `q${idx + 1}`,
        required: q.required ?? true,
    }));

    return parsed;
}

export async function generateSurveyFromImage(params: {
    target: SurveyTarget;
    mode: SurveyMode;
    imageBase64: string;
    mimeType: string;
    prompt?: string;
}): Promise<GeneratedSurvey> {
    const { target, mode, imageBase64, mimeType, prompt } = params;

    const model = getGenerativeModel(vertexAI, { model: 'gemini-1.5-flash' });

    const systemPrompt = `당신은 교육용 설문지를 전문적으로 만드는 AI 어시스턴트입니다.
이미지에서 내용을 추출하고 분석하여 설문 문항을 생성해주세요.

대상: ${TARGET_DESCRIPTIONS[target]}
형식: ${MODE_DESCRIPTIONS[mode]}

다음 JSON 형식으로만 응답해주세요:
{
  "title": "설문 제목",
  "description": "설문 설명",
  "questions": [
    {
      "id": "q1",
      "type": "single_choice | multiple_choice | text | long_text",
      "question": "질문 내용",
      "options": ["선택지1", "선택지2"]
    }
  ]
}

설문은 5-10개 문항으로 구성해주세요.
${prompt ? `\n추가 요청사항: ${prompt}` : ''}`;

    const result = await model.generateContent([
        { text: systemPrompt },
        {
            inlineData: {
                mimeType,
                data: imageBase64,
            },
        },
    ]);

    const response = result.response.text();

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Failed to parse survey response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as GeneratedSurvey;

    parsed.questions = parsed.questions.map((q, idx) => ({
        ...q,
        id: q.id || `q${idx + 1}`,
        required: q.required ?? true,
    }));

    return parsed;
}
