import { NormalizedContent } from '../types';
import { ContentNormalizer } from '../ContentNormalizer';

const SEEDED_TRIVIA_QUESTIONS = [
  {
    subject: 'science' as const,
    question: 'Suyun kimyasal formülü nedir?',
    correct: 'H2O',
    options: ['H2O', 'CO2', 'NaCl', 'CH4'],
    explanation: 'Su molekülü iki hidrojen ve bir oksijen atomundan oluşur.',
    category: 'Kimya'
  },
  {
    subject: 'math' as const,
    question: 'Bir dik üçgende hipotenüsün karesi dik kenarların kareleri toplamına eşittir. Bu teoremin adı nedir?',
    correct: 'Pisagor Teoremi',
    options: ['Pisagor Teoremi', 'Öklid Teoremi', 'Tales Teoremi', 'Fermat Teoremi'],
    explanation: 'a² + b² = c² bağıntısı Pisagor Teoremi olarak bilinir.',
    category: 'Geometri'
  },
  {
    subject: 'history' as const,
    question: 'Anadolu’nun kapılarını Türklere açan 1071 tarihli meydan muharebesi hangisidir?',
    correct: 'Malazgirt Meydan Muharebesi',
    options: ['Malazgirt Meydan Muharebesi', 'Dandanakan Savaşı', 'Pasinler Savaşı', 'Miryokefalon Savaşı'],
    explanation: '1071 Malazgirt Zaferi ile Türkiye tarihi başlamıştır.',
    category: 'Tarih'
  },
  {
    subject: 'geography' as const,
    question: 'Türkiye’nin başkenti neresidir?',
    correct: 'Ankara',
    options: ['Ankara', 'İstanbul', 'İzmir', 'Bursa'],
    explanation: 'Ankara, 13 Ekim 1923’te Türkiye’nin başkenti ilan edilmiştir.',
    category: 'Coğrafya'
  }
];

export class TriviaExamAdapter {
  /**
   * Soru bankasından veya Open Trivia DB'den soru getirir
   */
  public static async getQuizQuestion(subjectQuery = 'science'): Promise<NormalizedContent> {
    const qSubject = subjectQuery.toLowerCase();
    const matched = SEEDED_TRIVIA_QUESTIONS.find(q => q.subject === qSubject) || SEEDED_TRIVIA_QUESTIONS[0];

    // Open Trivia DB Çevrimiçi Deneme
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch('https://opentdb.com/api.php?amount=1&type=multiple', { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        const item = json.results?.[0];
        if (item) {
          const allOptions = [...item.incorrect_answers, item.correct_answer].sort(() => Math.random() - 0.5);
          return ContentNormalizer.normalize({
            providerId: 'prov_opentdb',
            contentType: 'trivia_question',
            subject: 'trivia',
            topic: item.category,
            title: `Genel Kültür Testi: ${item.category}`,
            content: item.question.replace(/&quot;/g, '"').replace(/&#039;/g, "'"),
            answer: item.correct_answer,
            answerExplanation: `Doğru cevap: ${item.correct_answer}`,
            difficulty: item.difficulty === 'hard' ? 4 : item.difficulty === 'medium' ? 3 : 2,
            gradeLevel: 9,
            licenseId: 'api_terms_only',
            attribution: 'Kaynak: Open Trivia Database (https://opentdb.com) - CC-BY-SA 4.0',
            metadata: { options: allOptions, category: item.category }
          });
        }
      }
    } catch {}

    // Fallback
    return ContentNormalizer.normalize({
      providerId: 'prov_opentdb',
      contentType: 'trivia_question',
      subject: matched.subject,
      topic: matched.category,
      title: `${matched.category} Sorusu`,
      content: matched.question,
      answer: matched.correct,
      answerExplanation: matched.explanation,
      difficulty: 2,
      gradeLevel: 9,
      licenseId: 'permissive_open',
      attribution: 'Kaynak: DersPusulası Doğrulanmış Soru Havuzu',
      metadata: { options: matched.options, category: matched.category }
    });
  }
}
