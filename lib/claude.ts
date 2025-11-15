import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface HintRequestParams {
  questionText: string;
  assignmentContext: string;
  answerKey: string | null;
  hintLevel: number;
  teacherInstructions: string | null;
  conversationHistory?: Array<{
    question_text: string;
    hint_response: string | null;
    created_at: string;
  }>;
}

/**
 * Generate a hint for a student question using Claude AI
 * This function ensures students receive hints, not direct answers
 */
export async function generateHint(params: HintRequestParams): Promise<string> {
  const {
    questionText,
    assignmentContext,
    answerKey,
    hintLevel,
    teacherInstructions,
    conversationHistory = [],
  } = params;

  // Construct the system prompt based on hint level
  const hintLevelGuidance = getHintLevelGuidance(hintLevel);

  const systemPrompt = `You are an educational AI tutor assistant. Your role is to help students learn by providing HINTS, not direct answers.

${hintLevelGuidance}

CRITICAL RULES:
1. NEVER provide the direct answer or solution
2. Guide the student to discover the answer themselves
3. Ask leading questions when appropriate
4. Reference relevant concepts or formulas without solving
5. Encourage critical thinking
6. Be supportive and patient
7. Remember previous questions and hints in this conversation - build on what you've already discussed

${teacherInstructions ? `TEACHER INSTRUCTIONS:\n${teacherInstructions}\n` : ''}

${answerKey ? `ANSWER KEY (for your reference only - DO NOT share with student):\n${answerKey}\n` : ''}

ASSIGNMENT CONTEXT:
${assignmentContext}`;

  try {
    // Build conversation messages including history
    const messages: Anthropic.MessageParam[] = [];

    // Add conversation history
    if (conversationHistory.length > 0) {
      for (const item of conversationHistory) {
        messages.push({
          role: 'user',
          content: item.question_text,
        });
        if (item.hint_response) {
          messages.push({
            role: 'assistant',
            content: item.hint_response,
          });
        }
      }
    }

    // Add current question
    messages.push({
      role: 'user',
      content: questionText,
    });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const textContent = message.content.find((block) => block.type === 'text');
    return textContent && textContent.type === 'text' ? textContent.text : 'Unable to generate hint at this time.';
  } catch (error) {
    console.error('Error generating hint:', error);
    throw new Error('Failed to generate hint. Please try again.');
  }
}

/**
 * Get guidance text based on hint level (1-5)
 */
function getHintLevelGuidance(level: number): string {
  const levelMap: Record<number, string> = {
    1: 'HINT LEVEL 1 (Minimal): Provide only the most subtle nudge. Ask a thought-provoking question or point to a general concept area. Do not reveal any specific steps.',
    2: 'HINT LEVEL 2 (Gentle): Point the student toward the right concept or method. You may ask a more specific question, but do not outline the solution steps.',
    3: 'HINT LEVEL 3 (Moderate): You may mention the general approach or formula that applies. Guide them toward the first step without completing it for them.',
    4: 'HINT LEVEL 4 (Detailed): Provide more specific guidance about the approach and steps involved. You may outline the problem-solving strategy, but still require the student to execute it.',
    5: 'HINT LEVEL 5 (Very Detailed): Give a thorough walkthrough of the approach and steps, but still require the student to perform the actual calculations or final reasoning. Do not provide the final answer.',
  };

  return levelMap[level] || levelMap[3];
}
