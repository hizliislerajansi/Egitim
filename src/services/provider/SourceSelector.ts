import { NormalizedContent, ProviderQuery } from './types';
import { MathAdapter } from './adapters/MathAdapter';
import { ScienceAdapter } from './adapters/ScienceAdapter';
import { GeographyAdapter } from './adapters/GeographyAdapter';
import { HistoryAdapter } from './adapters/HistoryAdapter';
import { LiteratureArtAdapter } from './adapters/LiteratureArtAdapter';
import { TriviaExamAdapter } from './adapters/TriviaExamAdapter';
import { DictionaryService } from '../dictionaryService';
import { ContentNormalizer } from './ContentNormalizer';

export class SourceSelector {
  /**
   * İstek türü ve derse göre en uygun adaptörü çağırır
   */
  public static async routeQuery(query: ProviderQuery): Promise<NormalizedContent> {
    const text = query.text.trim();

    switch (query.subject) {
      case 'math': {
        const num = Number(text);
        if (!isNaN(num) && query.queryType === 'math_solve' && !text.includes('+') && !text.includes('-') && !text.includes('*') && !text.includes('/')) {
          return MathAdapter.getNumberFact(num);
        }
        return MathAdapter.solveOrExplain(text);
      }

      case 'science': {
        if (query.queryType === 'chemistry_compound') {
          return ScienceAdapter.getCompound(text);
        }
        if (query.queryType === 'astronomy_planet' || ['earth', 'dünya', 'mars', 'jupiter', 'jüpiter', 'saturn', 'satürn'].includes(text.toLowerCase())) {
          return ScienceAdapter.getPlanet(text);
        }
        return ScienceAdapter.getElement(text);
      }

      case 'geography': {
        if (query.queryType === 'weather_forecast' || text.toLowerCase().includes('hava') || text.toLowerCase().includes('weather')) {
          return GeographyAdapter.getWeather();
        }
        return GeographyAdapter.getCountry(text);
      }

      case 'history': {
        return HistoryAdapter.getEvent(text);
      }

      case 'literature': {
        if (query.queryType === 'art_work' || text.toLowerCase().includes('tablo') || text.toLowerCase().includes('sanat') || text.toLowerCase().includes('art')) {
          return LiteratureArtAdapter.getArtwork(text);
        }
        return LiteratureArtAdapter.getLiterature(text);
      }

      case 'trivia': {
        return TriviaExamAdapter.getQuizQuestion(query.topic || 'science');
      }

      case 'english': {
        const dictRes = await DictionaryService.lookupWord(text);
        return ContentNormalizer.normalize({
          providerId: 'prov_free_dict_api',
          contentType: 'definition',
          subject: 'english',
          title: dictRes.word,
          content: dictRes.meanings?.[0]?.definitions?.[0]?.definition || `Definition of ${dictRes.word}`,
          translation: dictRes.turkishMeaning,
          difficulty: dictRes.cefrLevel === 'B1' ? 3 : dictRes.cefrLevel === 'A2' ? 2 : 1,
          gradeLevel: 9,
          cefrLevel: dictRes.cefrLevel,
          licenseId: 'api_terms_only',
          attribution: 'Kaynak: Free Dictionary API & CEFR-J',
          metadata: { phonetic: dictRes.phonetic, audio_url: dictRes.audioUrl }
        });
      }

      default: {
        return MathAdapter.solveOrExplain(text);
      }
    }
  }
}
