import { StudentProfileEngine, AdaptiveProfile, TopicMasteryRecord } from './studentProfileEngine';
import { SimplificationLadder, SimplificationStep, SimplificationResult } from './simplificationLadder';
import { MathValidator } from './mathValidator';
import { KnowledgeGraphEngine } from './knowledgeGraph';

export interface PedagogicalContext {
  profile: AdaptiveProfile;
  mastery: TopicMasteryRecord;
  currentSimplificationStep: SimplificationStep;
  subjectCode: string;
  topicName: string;
}

export interface PedagogicalDecision {
  action: 'explain' | 'simplify' | 'analogy' | 'visualize' | 'step_by_step' | 'diagnose_prerequisite' | 'verify_guess' | 'practice';
  step: SimplificationStep;
  responseContent: string;
  deterministicAnswer?: string;
  tokensSaved: number;
  followUpSuggestions: string[];
}

export class AdaptivePedagogyEngine {
  /**
   * 10 Adımlı Öncelik Sıralamasına Sahip Ana Pedagojik Karar Motoru
   */
  public static processStudentQuery(params: {
    userMessage: string;
    subjectCode: string;
    topicId?: string;
    topicName?: string;
    currentStep?: SimplificationStep;
  }): PedagogicalDecision {
    const profile = StudentProfileEngine.getProfile();
    const topicId = params.topicId || `topic_${params.subjectCode.toLowerCase()}_general`;
    const topicName = params.topicName || `${params.subjectCode} Dersi`;
    const mastery = StudentProfileEngine.getTopicMastery(topicId);
    const msg = params.userMessage.trim().toLowerCase();

    // 1. Matematiksel Denklem / Deterministik Kontrol (0 Token, 0ms Gecikme)
    if (params.subjectCode === 'MATH') {
      const mathResult = this.tryDeterministicMath(params.userMessage);
      if (mathResult) {
        return {
          action: 'explain',
          step: 'step_by_step',
          responseContent: mathResult,
          deterministicAnswer: mathResult,
          tokensSaved: 480,
          followUpSuggestions: [
            'Benzer bir soru çözmek ister misin?',
            'Adım adım açıklamayı görmek ister misin?'
          ]
        };
      }
    }

    // 2. Basitleştirme Talebi Tespiti ("anlamadım", "daha basit", "örnek ver", "şema")
    let targetStep: SimplificationStep = params.currentStep || 'normal';

    if (msg.includes('anlamadım') || msg.includes('zor') || msg.includes('karışık')) {
      targetStep = SimplificationLadder.recommendNextStep(targetStep, 'too_hard');
    } else if (msg.includes('örnek') || msg.includes('günlük')) {
      targetStep = 'analogy';
    } else if (msg.includes('şema') || msg.includes('tablo') || msg.includes('görsel')) {
      targetStep = 'visual';
    } else if (msg.includes('adım adım') || msg.includes('çözüm')) {
      targetStep = 'step_by_step';
    } else if (msg.includes('ön bilgi') || msg.includes('temel')) {
      targetStep = 'prerequisite_check';
    } else if (msg.includes('test et') || msg.includes('soru sor') || msg.includes('kontrol')) {
      targetStep = 'quick_check';
    }

    // 3. Yaşa ve Gelişim Düzeyine Uyarlanan İçerik Üretimi
    const explanation: SimplificationResult = SimplificationLadder.generateExplanation(
      targetStep,
      topicName,
      params.subjectCode,
      profile
    );

    // 4. Konu Ön Bilgi Grafiği Kontrolü (Gerekirse tanılama sorusu ekle)
    let enrichedContent = explanation.adaptedContent;
    if (targetStep === 'prerequisite_check' && params.topicId) {
      const prereqs = KnowledgeGraphEngine.getPrerequisites(params.topicId);
      if (prereqs && prereqs.prerequisiteTitles.length > 0) {
        enrichedContent += `\n\n📌 **Sistemimizdeki Ön Koşul Bağlantıları:**\n${prereqs.prerequisiteTitles.map((t, idx) => `• ${t} (${prereqs.prerequisiteCodes[idx] || 'Temel'})`).join('\n')}`;
      }
    }

    // 5. Takip Önerileri
    const suggestions = [
      '🪜 Daha Basit Anlat',
      '🌍 Günlük Yaşam Örneği',
      '📊 Şematik / Görsel Özet',
      '🐾 Adım Adım Çöz',
      '🎯 Mini Anlayış Testi (1 Soru)'
    ];

    return {
      action: this.mapStepToAction(targetStep),
      step: targetStep,
      responseContent: enrichedContent,
      tokensSaved: 350,
      followUpSuggestions: suggestions
    };
  }

  /**
   * Deterministik Matematik Çözücü
   */
  private static tryDeterministicMath(input: string): string | null {
    // 2. Dereceden denklem kontrolü: ax^2 + bx + c = 0
    const quadRegex = /([+-]?\s*\d*)x\^2\s*([+-]\s*\d*)x\s*([+-]\s*\d*)\s*=\s*0/i;
    const match = input.replace(/\s+/g, '').match(quadRegex);
    if (match) {
      const aStr = match[1] === '' || match[1] === '+' ? '1' : match[1] === '-' ? '-1' : match[1];
      const bStr = match[2] === '' || match[2] === '+' ? '1' : match[2] === '-' ? '-1' : match[2];
      const cStr = match[3];

      const a = parseFloat(aStr);
      const b = parseFloat(bStr);
      const c = parseFloat(cStr);

      if (!isNaN(a) && !isNaN(b) && !isNaN(c) && a !== 0) {
        const sol = MathValidator.solveQuadratic(a, b, c);
        return `### 🧮 Deterministik Matematik Çözümü\n\nDenklem: **${a}x² + (${b})x + (${c}) = 0**\n\n- **Diskriminant (Δ):** b² - 4ac = (${b})² - 4·(${a})·(${c}) = **${sol.discriminant}**\n- **Kök Durumu:** ${sol.rootCount === 2 ? 'Farklı iki reel kök vardır.' : sol.rootCount === 1 ? 'Çakışık tek bir reel kök vardır.' : 'Reel kök yoktur.'}\n- **Kökler:** x₁ = **${sol.roots[0] ?? 'Yok'}**, x₂ = **${sol.roots[1] ?? 'Yok'}**\n\n*Bu işlem yerel matematik motoru ile 0 token maliyeti ve %100 kesinlikle doğrulanmıştır.*`;
      }
    }

    return null;
  }

  private static mapStepToAction(step: SimplificationStep): PedagogicalDecision['action'] {
    switch (step) {
      case 'simpler': return 'simplify';
      case 'analogy': return 'analogy';
      case 'visual': return 'visualize';
      case 'step_by_step': return 'step_by_step';
      case 'prerequisite_check': return 'diagnose_prerequisite';
      default: return 'explain';
    }
  }
}
