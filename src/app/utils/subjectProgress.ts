// Generic subject progress utility
// Used by StudentDashboard to sync progress from any subject page

export interface SubtopicDef {
  id: string;
  taskCount: number;
}

export interface SubjectStats {
  stars: number;
  totalTasks: number;
  percent: number;
}

export function getSubjectStats(lsKey: string, subtopics: SubtopicDef[]): SubjectStats {
  const totalTasks = subtopics.reduce((a, s) => a + s.taskCount, 0);
  try {
    const raw = localStorage.getItem(lsKey);
    if (!raw) return { stars: 0, totalTasks, percent: 0 };
    const data = JSON.parse(raw);
    let stars = 0;
    subtopics.forEach(({ id, taskCount }) => {
      for (let i = 1; i <= taskCount; i++) {
        if (data[id]?.[i]?.result === true) stars++;
      }
    });
    return { stars, totalTasks, percent: Math.round((stars / totalTasks) * 100) };
  } catch {
    return { stars: 0, totalTasks, percent: 0 };
  }
}

// ── Subject LS keys & subtopic registry ──────────────────────────────────────

export const SUBJECT_REGISTRY = {
  math: {
    lsKey: "ilim_math_progress",
    subtopics: [
      { id: "numbers_count10",  taskCount: 5 },
      { id: "numbers_count20",  taskCount: 5 },
      { id: "numbers_compare",  taskCount: 5 },
      { id: "addition_to10",    taskCount: 5 },
      { id: "subtraction_to10", taskCount: 5 },
      { id: "addSub_to20",      taskCount: 5 },
      { id: "word_addition",    taskCount: 5 },
      { id: "word_subtraction", taskCount: 5 },
      { id: "word_compare",     taskCount: 5 },
    ],
  },
  russian: {
    lsKey: "ilim_russian_progress",
    subtopics: [
      { id: "ru_vowels",    taskCount: 5 },
      { id: "ru_consonants",taskCount: 5 },
      { id: "ru_syllables", taskCount: 5 },
      { id: "ru_nouns",     taskCount: 5 },
      { id: "ru_verbs",     taskCount: 5 },
      { id: "ru_sentences", taskCount: 5 },
      { id: "ru_short_words",taskCount: 5 },
      { id: "ru_capitals",  taskCount: 5 },
      { id: "ru_reading",   taskCount: 5 },
    ],
  },
  science: {
    lsKey: "ilim_science_progress",
    subtopics: [
      { id: "phy_light",   taskCount: 5 },
      { id: "phy_states",  taskCount: 5 },
      { id: "phy_sound",   taskCount: 5 },
      { id: "geo_earth",   taskCount: 5 },
      { id: "geo_nature",  taskCount: 5 },
      { id: "geo_kyrgyzstan", taskCount: 5 },
      { id: "bio_animals", taskCount: 5 },
      { id: "bio_plants",  taskCount: 5 },
      { id: "bio_human",   taskCount: 5 },
    ],
  },
  english: {
    lsKey: "ilim_english_progress",
    subtopics: [
      { id: "eng_abc_am",     taskCount: 5 },
      { id: "eng_abc_nz",     taskCount: 5 },
      { id: "eng_vowels",     taskCount: 5 },
      { id: "eng_colors",     taskCount: 5 },
      { id: "eng_numbers",    taskCount: 5 },
      { id: "eng_animals",    taskCount: 5 },
      { id: "eng_greetings",  taskCount: 5 },
      { id: "eng_intro",      taskCount: 5 },
      { id: "eng_how_are_you",taskCount: 5 },
    ],
  },
  kyrgyz: {
    lsKey: "ilim_kyrgyz_progress",
    subtopics: [
      { id: "ky_vowels",    taskCount: 5 },
      { id: "ky_consonants",taskCount: 5 },
      { id: "ky_syllables", taskCount: 5 },
      { id: "ky_numbers",   taskCount: 5 },
      { id: "ky_colors",    taskCount: 5 },
      { id: "ky_family",    taskCount: 5 },
      { id: "ky_greetings", taskCount: 5 },
      { id: "ky_intro",     taskCount: 5 },
      { id: "ky_questions", taskCount: 5 },
    ],
  },
};
