import { LicenseType } from './types';

export interface LicensePolicy {
  canStoreOffline: boolean;
  canRedistribute: boolean;
  requiresAttribution: boolean;
  allowScraping: boolean;
  riskRating: 'safe' | 'attribution_needed' | 'restricted' | 'quarantine';
  explanation: string;
}

export class LicenseChecker {
  private static policies: Record<LicenseType, LicensePolicy> = {
    permissive_open: {
      canStoreOffline: true,
      canRedistribute: true,
      requiresAttribution: false,
      allowScraping: true,
      riskRating: 'safe',
      explanation: 'Açık lisans (MIT/CC0/Public Domain); yerel saklama ve serbest kullanım tam onaylıdır.'
    },
    attribution_required: {
      canStoreOffline: true,
      canRedistribute: true,
      requiresAttribution: true,
      allowScraping: true,
      riskRating: 'attribution_needed',
      explanation: 'Atıf gerektiren açık lisans (CC-BY / CC-BY-SA); kaynak adı ve lisans künyesi zorunludur.'
    },
    api_terms_only: {
      canStoreOffline: true,
      canRedistribute: false,
      requiresAttribution: true,
      allowScraping: false,
      riskRating: 'safe',
      explanation: 'Resmi açık REST API; belirlenen kullanım şartlarına ve önbellek politikasına uygundur.'
    },
    proprietary_reference: {
      canStoreOffline: false,
      canRedistribute: false,
      requiresAttribution: true,
      allowScraping: false,
      riskRating: 'restricted',
      explanation: 'Telif hakkı saklı akademik kaynak; izinsiz scraping YAPILAMAZ. Yalnızca bağlamsal derin bağlantı ve referans sunulur.'
    },
    quarantined: {
      canStoreOffline: false,
      canRedistribute: false,
      requiresAttribution: false,
      allowScraping: false,
      riskRating: 'quarantine',
      explanation: 'Lisansı belirsiz veya ihlal şüphesi bulunan veri; karantinaya alınmış ve öğrenciye sunumu engellenmiştir.'
    }
  };

  /**
   * Lisans politikasını döner
   */
  public static getPolicy(licenseType: LicenseType): LicensePolicy {
    return this.policies[licenseType] || this.policies.quarantined;
  }

  /**
   * İçeriğin yerel SQLite'ta kalıcı önbelleğe alınıp alınamayacağını denetler
   */
  public static isCachePermitted(licenseType: LicenseType): boolean {
    return this.getPolicy(licenseType).canStoreOffline;
  }

  /**
   * İçeriğin öğrenciye gösterilmesinin yasal açıdan güvenli olup olmadığını doğrular
   */
  public static isSafeToDisplay(licenseType: LicenseType): boolean {
    return licenseType !== 'quarantined';
  }

  /**
   * Zorunlu atıf metnini oluşturur
   */
  public static formatAttribution(providerName: string, licenseName: string, sourceUrl?: string): string {
    if (sourceUrl) {
      return `Kaynak: ${providerName} (${licenseName}) - [Doğrula](${sourceUrl})`;
    }
    return `Kaynak: ${providerName} (${licenseName})`;
  }
}
