import fs from 'fs';
import path from 'path';
import { createDatabaseConnection } from '../db/schema';


interface VocabularyEntry {
  word: string;
  meaning: string;
  pos: string;
}


interface ChatMessage {
  role: string;
  content?: string;
}

interface Choice {
  index: number;
  message: ChatMessage;
  finish_reason?: string | null;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface LLMResponse {
  sentence: string;
  correct_answer: string;
  distractors: string[];
}


// Parse vocabulary file
function parseVocabulary(filePath: string): VocabularyEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n').filter(line => line.length > 0 && !line.startsWith('#'));
  
  return lines.map(line => {
    const [word, meaning, pos] = line.split(';');
    return { word: word.trim(), meaning: meaning.trim(), pos: pos.trim() };
  });
}

// Group vocabulary by part of speech
function groupByPOS(vocabulary: VocabularyEntry[]): Record<string, VocabularyEntry[]> {
  const grouped: Record<string, VocabularyEntry[]> = {};
  
  for (const entry of vocabulary) {
    if (!grouped[entry.pos]) {
      grouped[entry.pos] = [];
    }
    grouped[entry.pos].push(entry);
  }
  
  return grouped;
}

// Generate sentence template based on POS
function getTemplate(pos: string): string {
  switch (pos) {
    case 'noun':
      return "___을/를 ___";
    case 'verb':
      return "나는 ___";
    case 'adjective':
      return "이것은 ___";
    case 'other':
      return "___";
    default:
      return "___";
  }
}

// Generate prompt for LLM
function generatePrompt(entry: VocabularyEntry, template: string): string {
  const { word, meaning, pos } = entry;
  
  return `Generate a short Korean sentence (max 6 words) with the word "${word}" (${meaning}, ${pos}) missing. Replace it with "___". 
Then provide 3 Korean words of the same part of speech that could be distractors — they should be semantically related but contextually distinct.

Example output format:
{
  "sentence": "아이가 ___를 먹었다.",
  "correct_answer": "사과",
  "distractors": ["바나나", "귤", "배"]
}

Please generate for: ${word} (${meaning}, ${pos})`;
}

async function llm(prompt: string): Promise<LLMResponse | null> {
  const API_URL = 'http://localhost:1234/v1/chat/completions';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "dummy", // adjust to your actual model name (e.g., "llama3", "mistral")
        messages: [
          {
            role: 'system',
            content: `You are a helpful Korean language tutor. Generate a sentence with a blank for the given word, and provide 3 distractors.

Instructions:
- Extract the missing word from the prompt.
- Return ONLY a JSON object with keys: "sentence", "correct_answer", "distractors".
- distractors must be an array of exactly 3 Korean words (same POS as the word).
- No extra text, no markdown.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 256,
        stream: false
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`LLM API error (${response.status}):`, errText);
      return null;
    }

    const data = await response.json() as ChatCompletionResponse;

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.warn('⚠️ No content in LLM response:', JSON.stringify(data, null, 2));
      return null;
    }

    // Clean up potential markdown or extra whitespace
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      // Handle ```json or plain ```
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        jsonStr = match[1].trim();
      } else {
        // Fallback: strip first/last triple backticks
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();
      }
    }

    // Parse JSON
    let result: LLMResponse;
    try {
      result = JSON.parse(jsonStr) as LLMResponse;
    } catch (e) {
      console.warn('⚠️ Failed to parse JSON:', { raw: jsonStr, error: e });
      return null;
    }

    // Optional: runtime validation (e.g., distractors count)
    if (
      typeof result.sentence !== 'string' ||
      typeof result.correct_answer !== 'string' ||
      !Array.isArray(result.distractors) ||
      result.distractors.length !== 3 ||
      !result.distractors.every(d => typeof d === 'string')
    ) {
      console.warn('⚠️ Invalid LLM output structure:', result);
      return null;
    }

    return result;

  } catch (error) {
    console.error('❌ LLM API call failed:', error);
    return null;
  }
}
function loadAllVocabulary(): VocabularyEntry[] {
  const vocabFiles = [
    'TOPIK-I-1-with-classes.txt'
  ].map(filename => path.join(__dirname, '../../', filename));

  const seenWords = new Set<string>();
  const mergedVocabulary: VocabularyEntry[] = [];

  for (const filePath of vocabFiles) {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Vocabulary file not found: ${filePath}`);
      continue;
    }

    const entries = parseVocabulary(filePath);
    
    // Add only new words
    const addedCount = entries.reduce((count, entry) => {
      if (!seenWords.has(entry.word)) {
        seenWords.add(entry.word);
        mergedVocabulary.push(entry);
        return count + 1;
      }
      return count;
    }, 0);

    console.log(`✅ Loaded ${addedCount} new entries (total unique so far: ${mergedVocabulary.length}) from ${path.basename(filePath)}`);
  }

  console.log(`➡️ Final vocabulary size: ${mergedVocabulary.length} unique entries`);
  return mergedVocabulary;
}

// Main function to generate sentence questions
async function generateSentenceQuestions() {
  try {
    // Parse vocabulary
    const vocabulary = loadAllVocabulary();
    
    // Group by POS
    const groupedVocab = groupByPOS(vocabulary);
    
    // Database connection
    const db = createDatabaseConnection();
    
    // Process each POS category
    for (const [pos, entries] of Object.entries(groupedVocab)) {
      const template = getTemplate(pos);
      
      // Process in batches for efficiency
      const batchSize = 10;
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        
        // Generate prompts for batch
        const prompts = batch.map(entry => generatePrompt(entry, template));
        
        // Process each prompt (in real implementation, use parallel processing)
        for (const prompt of prompts) {
          try {
            const response = await llm(prompt);
            
            if (!response) continue;
            
            // Find word IDs from database
            const targetWord = await db.selectFrom('word')
              .where('korean', '=', response.correct_answer)
              .selectAll()
              .executeTakeFirst();
            
            if (!targetWord) continue;
                        
            // Insert into database
            if (response.distractors.length >= 3) {
              await db.insertInto('sentence_question')
                .values({
                  word_id: targetWord.id,
                  korean_sentence: response.sentence.replace('___', '____'),
                  correct_answer: response.correct_answer,
                  distractor_word1_id: response.distractors[0],
                  distractor_word2_id: response.distractors[1],
                  distractor_word3_id: response.distractors[2]
                })
                .execute();
              
              console.log(`Generated question for: ${response.correct_answer}`);
            }
          } catch (error) {
            console.error(`Error processing prompt for ${prompt}:`, error);
          }
        }
      }
    }
    
    console.log('Sentence question generation completed!');
  } catch (error) {
    console.error('Error in generateSentenceQuestions:', error);
  }
}

// Run the script
generateSentenceQuestions();
