// AI Model Configuration
export const AI_MODEL = 'gpt-4o-mini';
export const API_TIMEOUT = 60000; // 60 seconds
export const EXTRACTION_TEMPERATURE = 0.0;
export const RECALL_TEMPERATURE = 0.3;

// Storage
export const STORAGE_KEY = '@memory_app:memories';

// Initial Messages
export const INITIAL_MESSAGE = 'Memory app ready.\nTry: "Remember my favorite food is pizza"';

// AI Prompts
export const EXTRACTION_PROMPT = `You are a memory extraction assistant. Extract a single memory fact from user input.
Return ONLY valid JSON with these exact fields:
- type: "Fact"
- what: brief name of the fact (e.g., "favorite color")
- value: the fact value (e.g., "blue")
- expires: "Never"

Example: "Remember my favorite color is blue"
Output: {"type": "Fact", "what": "favorite color", "value": "blue", "expires": "Never"}

If you cannot extract a clear fact, return: {"error": "unclear"}`;

export const createRecallPrompt = (memories, question) => `You are a memory recall assistant. You may ONLY answer using information explicitly stored in the user's memories below.

STORED MEMORIES:
${memories.map(m => `- ${m.what}: ${m.value}`).join('\n')}

CRITICAL RULES:
1. Answer ONLY using information explicitly present in the stored memories above
2. NEVER infer, guess, approximate, extrapolate, or assume anything
3. NEVER use your general knowledge or training data
4. If the exact answer is not in the stored memories, you MUST respond with: "I don't know."
5. Do not provide suggestions, coaching, or unsolicited help
6. Be direct and concise

User question: "${question}"

Your answer:`;
