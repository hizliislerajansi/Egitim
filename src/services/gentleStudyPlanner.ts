import { AdaptiveProfile } from './studentProfileEngine';
import { MasteryEngine } from './masteryEngine';

export interface PlannedStudyTask {
  id: string;
  subjectCode: string;
  subjectName: string;
  taskTitle: string;
  durationMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  taskType: 'concept' | 'practice' | 'simulation' | 'review';
  isCompleted: boolean;
}

export interface DailyStudySessionPlan {
  totalMinutes: number;
  tasks: PlannedStudyTask[];
  breakRecommendation?: string;
  isOverdueRebalanced: boolean;
  rebalancedCount: number;
}

export class GentleStudyPlanner {
  /**
   * Bunaltmayan, Dengeli ve Kişisel Günlük Çalışma Planı Üreticisi
   * - Bir oturumda 3-4 yönetilebilir mini görev sunar.
   * - Zor derslerin (Matematik, Fizik) arasına görsel veya dil etkinlikleri (İngilizce, Simülasyon) serpiştirir (Interleaving).
   * - Öğrencinin girmediği günlerde geriye dönük yığılmayı önler (Zero Pile-up).
   * - Mola önerilerini suçluluk hissettirmeyen, dinlendirici bir dille sunar.
   */
  public static generateDailyPlan(profile: AdaptiveProfile): DailyStudySessionPlan {
    // 1. Önce bekleyen tekrarları yığılmayı önleyecek şekilde dengele
    const rebalanceResult = MasteryEngine.rebalanceReviewSchedule(15);

    const availableMinutes = Math.min(90, Math.max(20, profile.dailyTimeMinutes));
    const tasks: PlannedStudyTask[] = [];

    // Zaman dağılımı (örneğin 45 dakika için 3 görev: 15m + 15m + 15m)
    const taskCount = availableMinutes <= 30 ? 2 : availableMinutes <= 60 ? 3 : 4;
    const minutesPerTask = Math.floor(availableMinutes / taskCount);

    // Görev 1: Öncelikli Ana Ders (Zorluk: Orta/Zor - Örn: Matematik veya Fizik)
    const mainSubject = profile.targetSubjects.includes('subj_math') 
      ? { code: 'MATH', name: 'Matematik', topic: 'Fonksiyonlar ve Grafik İncelemesi' }
      : { code: 'PHYS', name: 'Fizik', topic: 'Kuvvet ve Hareket Yasaları' };

    tasks.push({
      id: `task_main_${Date.now()}_1`,
      subjectCode: mainSubject.code,
      subjectName: mainSubject.name,
      taskTitle: mainSubject.topic,
      durationMinutes: minutesPerTask,
      difficulty: 'medium',
      taskType: 'concept',
      isCompleted: false
    });

    // Görev 2: Hafifletici / Görsel veya Pratik Etkinlik (Zorluk: Kolay/Orta - Örn: İngilizce veya Sanal Lab)
    if (taskCount >= 2) {
      tasks.push({
        id: `task_relief_${Date.now()}_2`,
        subjectCode: 'ENG',
        subjectName: 'İngilizce',
        taskTitle: 'Günlük Hayat Diyalog & Kelime Pratiği',
        durationMinutes: minutesPerTask,
        difficulty: 'easy',
        taskType: 'practice',
        isCompleted: false
      });
    }

    // Görev 3: Sanal Deney / Pekiştirme veya Aralıklı Tekrar
    if (taskCount >= 3) {
      tasks.push({
        id: `task_sim_${Date.now()}_3`,
        subjectCode: 'PHYS',
        subjectName: 'Sanal Laboratuvar (PhET)',
        taskTitle: 'Kuvvetler ve Hareket Simülasyonu ile Gözlem',
        durationMinutes: minutesPerTask,
        difficulty: 'easy',
        taskType: 'simulation',
        isCompleted: false
      });
    }

    // Görev 4: Ekstra soru tekrarı (yalnızca süre >60 dakika ise)
    if (taskCount >= 4) {
      tasks.push({
        id: `task_rev_${Date.now()}_4`,
        subjectCode: 'CHEM',
        subjectName: 'Kimya',
        taskTitle: 'Periyodik Sistem 5 Soruluk Mini Pekiştirme',
        durationMinutes: minutesPerTask,
        difficulty: 'medium',
        taskType: 'review',
        isCompleted: false
      });
    }

    // Mola tavsiyesi (saat ve süreye göre nazik ve teşvik edici)
    const hour = new Date().getHours();
    let breakRecommendation: string | undefined;

    if (hour >= 22) {
      breakRecommendation = '🌙 Saat biraz ilerledi. Kendini zorlamadan son bir görevi tamamlayıp güzel bir uykuyla zihnini dinlendirmen öğrenmeyi pekiştirir.';
    } else if (availableMinutes >= 45) {
      breakRecommendation = '🌱 2. görevden sonra 5 dakikalık su ve göz dinlendirme molası vermen odaklanmanı tazeleyecektir.';
    }

    return {
      totalMinutes: availableMinutes,
      tasks,
      breakRecommendation,
      isOverdueRebalanced: rebalanceResult.rescheduledCount > 0,
      rebalancedCount: rebalanceResult.rescheduledCount
    };
  }

  /**
   * Yorgunluk ve Seans Süresi Kontrolü
   */
  public static checkSessionFatigue(consecutiveMinutes: number, questionsAnswered: number): {
    needsBreak: boolean;
    gentleMessage?: string;
  } {
    if (consecutiveMinutes >= 40 || questionsAnswered >= 15) {
      return {
        needsBreak: true,
        gentleMessage: '👏 Harika bir odaklanma sergiledin! Kısa bir 5 dakikalık nefes molası, öğrendiklerinin hafızana yerleşmesini sağlar. Dinlenmeye hazır mısın?'
      };
    }

    return { needsBreak: false };
  }
}
