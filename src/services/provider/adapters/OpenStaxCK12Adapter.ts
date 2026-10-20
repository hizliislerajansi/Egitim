import { NormalizedContent, SubjectType } from '../types';
import { ContentNormalizer } from '../ContentNormalizer';

export interface OpenTextbookChapter {
  id: string;
  source: 'openstax' | 'ck12';
  title: string;
  subject: SubjectType;
  curriculumCode: string;
  chapterUrl: string;
  license: string;
  summary: string;
  keyFormulas: string[];
  attribution: string;
}

export const OPEN_TEXTBOOK_CHAPTERS: OpenTextbookChapter[] = [
  {
    id: 'openstax_physics_forces',
    source: 'openstax',
    title: 'OpenStax High School Physics: Newton’s Laws of Motion',
    subject: 'science',
    curriculumCode: 'FIZ-09.02',
    chapterUrl: 'https://openstax.org/books/physics/pages/4-1-development-of-force-concept',
    license: 'CC-BY 4.0 (Açık ve Yeniden Dağıtılabilir)',
    summary: 'Kuvvet kavramı, eylemsizlik ilkesi, temel dinamik yasası (F = m · a) ve etki-tepki prensibi ayrıntılı örneklerle anlatılmaktadır.',
    keyFormulas: ['F_net = m · a', 'F_g = m · g', 'f_s <= mu_s · N'],
    attribution: 'OpenStax College Physics, Rice University (CC-BY 4.0)'
  },
  {
    id: 'openstax_chemistry_atoms',
    source: 'openstax',
    title: 'OpenStax Chemistry: Atoms, Molecules, and Ions',
    subject: 'science',
    curriculumCode: 'KIM-09.01',
    chapterUrl: 'https://openstax.org/books/chemistry-2e/pages/2-1-early-ideas-in-atomic-theory',
    license: 'CC-BY 4.0 (Açık ve Yeniden Dağıtılabilir)',
    summary: 'Dalton, Thomson, Rutherford ve Bohr atom modelleri; izotoplar ve modern kuantum periyodik tablosunun temelleri.',
    keyFormulas: ['Kütle No = Proton + Nötron', 'E = h · nu', 'lambda · nu = c'],
    attribution: 'OpenStax Chemistry 2e, Rice University (CC-BY 4.0)'
  },
  {
    id: 'ck12_algebra_quadratics',
    source: 'ck12',
    title: 'CK-12 Foundation: Quadratic Equations and Functions',
    subject: 'math',
    curriculumCode: 'MAT-09.02',
    chapterUrl: 'https://www.ck12.org/algebra/quadratic-equations/',
    license: 'CC-BY-NC 3.0 (Ticari Olmayan Eğitim Amaçlı Kullanım)',
    summary: 'İkinci dereceden denklemlerin çarpanlara ayırma, tam kareye tamamlama ve diskriminant formülü ile çözümü.',
    keyFormulas: ['x = (-b +- sqrt(b^2 - 4ac)) / (2a)', 'Delta = b^2 - 4ac'],
    attribution: 'CK-12 Foundation FlexBook (CC-BY-NC 3.0)'
  },
  {
    id: 'ck12_biology_cell',
    source: 'ck12',
    title: 'CK-12 Biology: Cell Structure and Function',
    subject: 'science',
    curriculumCode: 'BIY-09.02',
    chapterUrl: 'https://www.ck12.org/biology/cell-biology/',
    license: 'CC-BY-NC 3.0 (Ticari Olmayan Eğitim Amaçlı Kullanım)',
    summary: 'Prokaryot ve ökaryot hücre yapısı, hücre zarı geçirgenliği ve organellerin metabolik görevleri.',
    keyFormulas: ['Fotosentez: 6CO2 + 6H2O -> C6H12O6 + 6O2', 'Solunum: C6H12O6 + 6O2 -> 6CO2 + 6H2O + ATP'],
    attribution: 'CK-12 Foundation FlexBook (CC-BY-NC 3.0)'
  }
];

export class OpenStaxCK12Adapter {
  /**
   * Müfredat koduna veya konuya göre açık ders kitabı bölümünü bulur
   */
  public static getCurriculumChapter(curriculumOrTopic: string): NormalizedContent {
    const q = curriculumOrTopic.trim().toLowerCase();
    const matched = OPEN_TEXTBOOK_CHAPTERS.find(
      c => c.curriculumCode.toLowerCase() === q || c.title.toLowerCase().includes(q) || c.subject === q
    ) || OPEN_TEXTBOOK_CHAPTERS[0];

    return ContentNormalizer.normalize({
      providerId: `prov_${matched.source}`,
      contentType: 'textbook_chapter',
      subject: matched.subject,
      topic: matched.title,
      title: matched.title,
      content: `Ders Kitabı: ${matched.title}\nLisans: ${matched.license}\nÖzet:\n${matched.summary}\n\nKritik Formüller:\n${matched.keyFormulas.join('\n')}`,
      difficulty: 3,
      gradeLevel: 9,
      curriculumMapping: matched.curriculumCode,
      licenseId: matched.source === 'openstax' ? 'attribution_required' : 'attribution_required',
      attribution: matched.attribution,
      sourceUrl: matched.chapterUrl,
      metadata: {
        source_publisher: matched.source,
        chapter_url: matched.chapterUrl,
        key_formulas: matched.keyFormulas,
        commercial_use_allowed: matched.source === 'openstax'
      }
    });
  }
}
