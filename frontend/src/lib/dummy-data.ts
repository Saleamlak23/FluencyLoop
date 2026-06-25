// src/lib/dummy-data.ts

import type {
  Scenario,
  WritingPrompt,
  WarmUpQuestion,
  ConversationTurn,
  SpeakingResult,
  WritingFeedback,
  SessionSummaryData,
} from "./types";

// ── Scenarios ──────────────────────────────────────────────────────────────

export const SCENARIOS: Scenario[] = [
  {
    id: "ordering-coffee",
    emoji: "☕",
    title: "Ordering Coffee",
    description:
      "You've just walked into a London coffee shop. Order your drink and handle any questions the barista has.",
    level: "everyday",
    totalTurns: 4,
  },
  {
    id: "asking-directions",
    emoji: "🗺️",
    title: "Asking for Directions",
    description:
      "You're lost in a new city. Stop someone on the street and ask how to get to the nearest train station.",
    level: "everyday",
    totalTurns: 4,
  },
  {
    id: "job-interview",
    emoji: "💼",
    title: "Job Interview Small Talk",
    description:
      "You've arrived early for a job interview. The receptionist starts a friendly conversation while you wait.",
    level: "free",
    totalTurns: 4,
  },
];

// ── Writing Prompts ────────────────────────────────────────────────────────

export const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: "describe-weekend",
    emoji: "📅",
    title: "Describe Your Weekend",
    instruction:
      "Write 3–5 sentences describing what you did last weekend. Be as specific as possible — what did you see, eat, or feel?",
    level: "everyday",
    minSentences: 3,
    maxSentences: 5,
  },
  {
    id: "email-colleague",
    emoji: "📧",
    title: "Email to a Colleague",
    instruction:
      "Write a short professional email to a colleague asking them to reschedule a meeting to Thursday afternoon.",
    level: "everyday",
    minSentences: 4,
    maxSentences: 6,
  },
  {
    id: "explain-job",
    emoji: "🧑‍💻",
    title: "Explain Your Job",
    instruction:
      "Imagine you're at a party and someone asks what you do for work. Write 3–5 sentences explaining your job in simple, natural English.",
    level: "foundation",
    minSentences: 3,
    maxSentences: 5,
  },
];

// ── Warm-Up Questions ──────────────────────────────────────────────────────

export const WARMUP_QUESTIONS: WarmUpQuestion[] = [
  { id: "wq-1", question: "What is one thing you are looking forward to this week?" },
  { id: "wq-2", question: "Describe the last meal you really enjoyed." },
  { id: "wq-3", question: "What is something new you learned recently?" },
  { id: "wq-4", question: "If you could visit any city in the world, where would you go and why?" },
  { id: "wq-5", question: "What does a typical morning look like for you?" },
];

// ── Dummy Conversation — "Ordering Coffee" ─────────────────────────────────

export const DUMMY_CONVERSATION: ConversationTurn[] = [
  {
    id: "turn-1-ai",
    role: "ai",
    text: "Good morning! Welcome to The Daily Grind. What can I get for you today?",
    hint: "Order your drink and mention how you'd like it made.",
  },
  {
    id: "turn-1-user",
    role: "user",
    text: "I want one café latte please and can you make it with less sugar?",
    wordFeedback: [
      { word: "I",      status: "correct" },
      { word: "want",   status: "caution", suggestion: "I'd like", reason: '"Want" sounds blunt in a service context. "I\'d like" is more polite.' },
      { word: "one",    status: "correct" },
      { word: "café",   status: "error",   suggestion: "latte",    reason: 'In everyday English, people just say "latte." "Café latte" sounds overly formal.' },
      { word: "latte",  status: "correct" },
      { word: "please", status: "correct" },
      { word: "and",    status: "correct" },
      { word: "can",    status: "correct" },
      { word: "you",    status: "correct" },
      { word: "make",   status: "correct" },
      { word: "it",     status: "correct" },
      { word: "with",   status: "correct" },
      { word: "less",   status: "caution", suggestion: "not too much", reason: '"Not too much sugar" or "without sugar" sounds more natural in a spoken order.' },
      { word: "sugar?", status: "correct" },
    ],
  },
  {
    id: "turn-2-ai",
    role: "ai",
    text: "Of course! One latte with not too much sugar — coming right up. Would you like that with full-fat milk, oat milk, or something else?",
    hint: "Tell the barista which milk you'd like.",
  },
  {
    id: "turn-2-user",
    role: "user",
    text: "Oat milk please. How much is it costing?",
    wordFeedback: [
      { word: "Oat",    status: "correct" },
      { word: "milk",   status: "correct" },
      { word: "please.", status: "correct" },
      { word: "How",    status: "correct" },
      { word: "much",   status: "correct" },
      { word: "is",     status: "caution", suggestion: "does it cost", reason: '"How much is it costing?" is grammatically incorrect. Use "How much does it cost?" or "How much is it?"' },
      { word: "it",     status: "caution" },
      { word: "costing?", status: "error", suggestion: "cost?", reason: 'Present continuous is wrong here. The simple present "cost" is correct for asking a price.' },
    ],
  },
  {
    id: "turn-3-ai",
    role: "ai",
    text: "That'll be £4.50 please. Will you be paying by card or cash?",
    hint: "Tell the barista how you'd like to pay.",
  },
  {
    id: "turn-3-user",
    role: "user",
    text: "I'll pay by card. Do you have a loyalty card I can use?",
    wordFeedback: [
      { word: "I'll",    status: "correct" },
      { word: "pay",     status: "correct" },
      { word: "by",      status: "correct" },
      { word: "card.",   status: "correct" },
      { word: "Do",      status: "correct" },
      { word: "you",     status: "correct" },
      { word: "have",    status: "correct" },
      { word: "a",       status: "correct" },
      { word: "loyalty", status: "correct" },
      { word: "card",    status: "correct" },
      { word: "I",       status: "correct" },
      { word: "can",     status: "correct" },
      { word: "use?",    status: "correct" },
    ],
  },
  {
    id: "turn-4-ai",
    role: "ai",
    text: "We do! Just download the Daily Grind app and scan it next time. Your latte is ready at the end of the counter — enjoy!",
    hint: "Wrap up the conversation politely.",
  },
  {
    id: "turn-4-user",
    role: "user",
    text: "Thank you very much. Have a good day!",
    wordFeedback: [
      { word: "Thank",  status: "correct" },
      { word: "you",    status: "correct" },
      { word: "very",   status: "correct" },
      { word: "much.",  status: "correct" },
      { word: "Have",   status: "correct" },
      { word: "a",      status: "correct" },
      { word: "good",   status: "correct" },
      { word: "day!",   status: "correct" },
    ],
  },
];

// ── Dummy Speaking Result ──────────────────────────────────────────────────

export const DUMMY_SPEAKING_RESULT: SpeakingResult = {
  scenarioId: "ordering-coffee",
  turnsCompleted: 4,
  totalTurns: 4,
  wordsSpoken: 47,
  errorsFound: 5,
  errorBreakdown: { grammar: 3, style: 2 },
  toneScore: 4,
  topInsights: [
    'Use "I\'d like" instead of "I want" in shops and restaurants.',
    'In British English, just say "latte" — not "café latte."',
    '"How much does it cost?" is the correct form for asking prices.',
  ],
  corrections: [
    {
      original: "want",
      better: "I'd like / could I have",
      why: '"Want" is grammatically correct but sounds blunt in a British service context.',
    },
    {
      original: "café latte",
      better: "latte",
      why: 'In everyday English, "latte" is the natural word. "Café latte" sounds overly formal.',
    },
    {
      original: "less sugar",
      better: "not too much sugar",
      why: '"Not too much sugar" sounds more natural in a spoken coffee order.',
    },
    {
      original: "is it costing",
      better: "does it cost",
      why: "Present continuous is grammatically incorrect when asking about prices.",
    },
    {
      original: "costing",
      better: "cost",
      why: 'Use the simple present "cost" for fixed prices.',
    },
  ],
};

// ── Dummy Writing Feedback ─────────────────────────────────────────────────

export const DUMMY_WRITING_FEEDBACK: WritingFeedback = {
  promptId: "describe-weekend",
  originalText:
    "Last weekend I go to the market with my friend. We buyed many vegetables and some fruits. The weather was very hot but we enjoyed it. After that we eated lunch in a small restaurant near the market. It was delicious and cheap.",
  rewrittenText:
    "Last weekend, I went to the market with a friend. We bought a lot of vegetables and some fruit. The weather was very hot, but we enjoyed ourselves. Afterwards, we had lunch at a small restaurant near the market. The food was delicious and great value.",
  errors: [
    {
      original: "I go",
      corrected: "I went",
      type: "grammar",
      explanation: 'Use the simple past tense "went" for completed actions in the past.',
    },
    {
      original: "buyed",
      corrected: "bought",
      type: "grammar",
      explanation: '"Buy" is an irregular verb. The past tense is "bought," not "buyed."',
    },
    {
      original: "many vegetables",
      corrected: "a lot of vegetables",
      type: "style",
      explanation: '"A lot of" sounds more natural in spoken and informal written English.',
    },
    {
      original: "we enjoyed it",
      corrected: "we enjoyed ourselves",
      type: "vocabulary",
      explanation: 'When "enjoy" refers to a general experience rather than a specific thing, use "ourselves."',
    },
    {
      original: "eated",
      corrected: "had",
      type: "grammar",
      explanation: '"Eat" is irregular — past tense is "ate." But "had lunch" sounds more natural here.',
    },
    {
      original: "cheap",
      corrected: "great value",
      type: "style",
      explanation: '"Cheap" can sound negative. "Good value" or "great value" is more natural and positive.',
    },
  ],
  overallScore: 3,
  topInsights: [
    'Remember irregular past tenses: go → went, buy → bought, eat → ate.',
    '"A lot of" is more natural than "many" in informal writing.',
    'Use "enjoyed ourselves" (not "enjoyed it") when describing a general fun experience.',
  ],
};

// ── Dummy Session Summary ──────────────────────────────────────────────────

export const DUMMY_SESSION_SUMMARY: SessionSummaryData = {
  streak: 4,
  sessionsCompleted: 12,
  speakingResult: DUMMY_SPEAKING_RESULT,
  writingFeedback: DUMMY_WRITING_FEEDBACK,
  topInsights: [
    'Use "I\'d like" instead of "I want" in polite requests.',
    "Master irregular past tenses: go → went, buy → bought.",
    '"A lot of" sounds more natural than "many" in everyday English.',
  ],
  levelSuggestion: "stay",
};

// ── Word of the Day list ───────────────────────────────────────────────────

import type { WordOfTheDay } from "./types";

export const WORDS_OF_THE_DAY: WordOfTheDay[] = [
  {
    id: "meticulous",
    word: "Meticulous",
    phonetic: "/məˈtɪk.jʊ.ləs/",
    definitions: [
      {
        partOfSpeech: "adjective",
        meaning: "Giving very careful attention to every detail.",
        examples: [
          {
            context: "Describing work quality",
            sentence: "She was meticulous in her research, checking every source twice.",
          },
          {
            context: "In a job interview",
            sentence: "I am meticulous with financial records — I never miss an error.",
          },
          {
            context: "Everyday conversation",
            sentence: "He is so meticulous that he irons his shirts every single morning.",
          },
        ],
      },
    ],
    challenge: {
      instruction:
        "Write a sentence using 'meticulous' to describe how you or someone you know approaches a task.",
      hints: [
        "Think of a task that requires a lot of care — cooking, coding, designing, writing.",
        'Try this structure: "[Person] is meticulous when it comes to [task]."',
        "Example start: \"My colleague is meticulous when reviewing contracts — she never rushes.\"",
      ],
      exampleAnswer:
        "I am meticulous when it comes to planning my week — I write every task down and check it off one by one.",
    },
  },
  {
    id: "negotiate",
    word: "Negotiate",
    phonetic: "/nɪˈɡəʊ.ʃi.eɪt/",
    definitions: [
      {
        partOfSpeech: "verb",
        meaning: "To have formal discussions to reach an agreement.",
        examples: [
          {
            context: "In a business meeting",
            sentence: "Both companies sat down to negotiate the terms of the contract.",
          },
          {
            context: "Asking for a raise",
            sentence: "I negotiated my salary before accepting the job offer.",
          },
          {
            context: "Everyday situation",
            sentence:
              "We negotiated with the landlord and got one month's rent free.",
          },
        ],
      },
    ],
    challenge: {
      instruction:
        "Write a sentence about a time you negotiated something — or a situation where you would need to negotiate.",
      hints: [
        "Think about price, salary, a deadline, or even household chores.",
        'Try: "I had to negotiate [something] because [reason]."',
        "Example: \"I had to negotiate my project deadline because the requirements changed at the last minute.\"",
      ],
      exampleAnswer:
        "I negotiated the price of my laptop with the seller and got a 10% discount.",
    },
  },
  {
    id: "concise",
    word: "Concise",
    phonetic: "/kənˈsaɪs/",
    definitions: [
      {
        partOfSpeech: "adjective",
        meaning:
          "Expressing what needs to be said clearly and in a few words — without unnecessary detail.",
        examples: [
          {
            context: "Writing feedback",
            sentence:
              "Your report is good, but try to make the introduction more concise.",
          },
          {
            context: "In a professional email",
            sentence:
              "Keep your emails concise — busy managers don't have time to read long messages.",
          },
          {
            context: "Everyday conversation",
            sentence:
              "She gave a concise answer — just three sentences — and everyone understood perfectly.",
          },
        ],
      },
    ],
    challenge: {
      instruction:
        "Write a concise sentence (under 15 words) describing what you do for work or study.",
      hints: [
        "Cut any words that don't add meaning — fewer is better.",
        'Start with: "I [verb] [what] for [who/where]."',
        'Example: "I design software systems for a technology company in Addis Ababa."',
      ],
      exampleAnswer:
        "I study electrical engineering at Addis Ababa Institute of Technology.",
    },
  },
  {
    id: "persistent",
    word: "Persistent",
    phonetic: "/pəˈsɪs.tənt/",
    definitions: [
      {
        partOfSpeech: "adjective",
        meaning:
          "Continuing firmly despite difficulty or opposition; not giving up.",
        examples: [
          {
            context: "Describing a person",
            sentence:
              "She was persistent in her job search, sending applications every day for two months.",
          },
          {
            context: "In a work context",
            sentence:
              "His persistent effort to improve the system eventually paid off.",
          },
          {
            context: "Everyday conversation",
            sentence:
              "The rain was persistent all week — it never stopped for more than an hour.",
          },
        ],
      },
    ],
    challenge: {
      instruction:
        "Write a sentence about something you have been persistent about — studying, a skill, a goal.",
      hints: [
        "Think of something that took repeated effort over time.",
        'Try: "I have been persistent in [activity] even when [difficulty]."',
        'Example: "I have been persistent in learning English even when progress felt slow."',
      ],
      exampleAnswer:
        "I have been persistent in practising my English every day, even on days when I feel too tired.",
    },
  },
  {
    id: "clarify",
    word: "Clarify",
    phonetic: "/ˈklær.ɪ.faɪ/",
    definitions: [
      {
        partOfSpeech: "verb",
        meaning: "To make something clearer and easier to understand.",
        examples: [
          {
            context: "In a meeting",
            sentence:
              "Could you clarify what you mean by 'urgent'? I want to make sure I prioritise correctly.",
          },
          {
            context: "Writing an email",
            sentence:
              "I'm writing to clarify the details of our agreement from last Tuesday.",
          },
          {
            context: "Classroom or learning",
            sentence:
              "The teacher paused to clarify the difference between 'affect' and 'effect'.",
          },
        ],
      },
    ],
    challenge: {
      instruction:
        "Write a polite sentence asking someone to clarify something — a task, an instruction, or a message.",
      hints: [
        'Use a polite opener: "Could you..." or "Would you mind..."',
        'Try: "Could you clarify [what exactly] so that I can [reason]?"',
        'Example: "Could you clarify which file format you need so that I can send the right version?"',
      ],
      exampleAnswer:
        "Could you clarify the deadline for this task? I want to make sure I submit it on time.",
    },
  },
  {
    id: "substantial",
    word: "Substantial",
    phonetic: "/səbˈstæn.ʃəl/",
    definitions: [
      {
        partOfSpeech: "adjective",
        meaning: "Large in size, value, or importance.",
        examples: [
          {
            context: "Talking about progress",
            sentence:
              "We've made substantial progress on the project over the past two weeks.",
          },
          {
            context: "Finance or business",
            sentence:
              "The company reported a substantial increase in revenue this quarter.",
          },
          {
            context: "Everyday context",
            sentence:
              "She ate a substantial breakfast before the long journey.",
          },
        ],
      },
    ],
    challenge: {
      instruction:
        "Use 'substantial' to describe a change, improvement, or amount in your life or work.",
      hints: [
        "Think about something that grew or improved significantly.",
        'Try: "There has been a substantial [noun] in [area]."',
        'Example: "There has been a substantial improvement in my confidence since I started practising English daily."',
      ],
      exampleAnswer:
        "I have noticed a substantial improvement in my writing since I started reviewing my corrections each week.",
  },
  },
  {
    id: "initiative",
    word: "Initiative",
    phonetic: "/ɪˈnɪʃ.ə.tɪv/",
    definitions: [
      {
        partOfSpeech: "noun",
        meaning:
          "The ability to assess and take action independently without being told what to do.",
        examples: [
          {
            context: "At work",
            sentence:
              "She showed great initiative by identifying the problem before anyone else noticed it.",
          },
          {
            context: "Job interview language",
            sentence:
              "I always take the initiative to learn new tools before they become required on the job.",
          },
          {
            context: "Team setting",
            sentence:
              "No one asked him to — he just took the initiative and organised the whole event.",
          },
        ],
      },
    ],
    challenge: {
      instruction:
        "Write a sentence about a time you took the initiative — at work, school, or in your personal life.",
      hints: [
        'The phrase "take the initiative" means to act without being asked.',
        'Try: "I took the initiative to [action] because [reason]."',
        'Example: "I took the initiative to create a shared folder for our team so everyone could access the files easily."',
      ],
      exampleAnswer:
        "I took the initiative to learn Python on my own before the course started so I could keep up with the pace.",
    },
  },
];

// ── Daily word picker ──────────────────────────────────────────────────────
// Deterministic: same word all day, rotates each day, never random on refresh.

export function getTodaysWord(): WordOfTheDay {
  const start     = new Date(2024, 0, 1).getTime();
  const today     = new Date();
  const daysSince = Math.floor(
    (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - start) /
      86_400_000
  );
  return WORDS_OF_THE_DAY[daysSince % WORDS_OF_THE_DAY.length];
}