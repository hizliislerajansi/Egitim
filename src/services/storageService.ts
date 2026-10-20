import { getDb } from '../db/database';
import { readSetting, writeSetting } from './apiClient';
import { listMediaAssets } from './mediaStorage';
import { exportDatabaseToJson, importDatabaseFromJson } from '../db/backup';

export type StorageType = 'local_appdata' | 'local_custom' | 'external_disk' | 'network_share' | 'browser_indexed_db';

export interface StorageLocationInfo {
  path: string;
  type: StorageType;
  isCustom: boolean;
  isWritable: boolean;
  label: string;
}

export interface StorageCategoryStats {
  id: string;
  name: string;
  bytes: number;
  formatted: string;
  fileCount: number;
  color: string;
}

export interface StorageUsageStats {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usedPercent: number;
  isWarningLowSpace: boolean; // True if free space is less than threshold
  warningThresholdMb: number;
  categories: StorageCategoryStats[];
  itemCount: number;
}

export interface LargeFileInfo {
  id: string;
  name: string;
  category: 'database' | 'narration' | 'visuals' | 'materials' | 'media_jobs';
  categoryLabel: string;
  sizeBytes: number;
  formattedSize: string;
  createdAt: string;
  canDelete: boolean;
}

export interface MigrationPlan {
  planId: string;
  sourcePath: string;
  targetPath: string;
  targetType: StorageType;
  totalSizeBytes: number;
  totalItemCount: number;
  requiredFreeSpaceBytes: number;
  estimatedSeconds: number;
  items: Array<{ id: string; category: string; sizeBytes: number }>;
}

export interface MigrationResult {
  success: boolean;
  message: string;
  transferredCount: number;
  transferredBytes: number;
  oldPath: string;
  newPath: string;
  cleanupPending: boolean;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i] || 'B'}`;
}

export class StorageService {

  /**
   * Get current active storage location information.
   */
  public static getStorageLocation(): StorageLocationInfo {
    return {path:'Bu uygulama / tarayıcı profili: localStorage (SQLite), IndexedDB (medya)',type:'browser_indexed_db',isCustom:false,isWritable:typeof localStorage !== 'undefined',label:'Cihazdaki uygulama profili'};
  }

  /**
   * Calculate storage usage across SQLite, IndexedDB narration, visuals and materials.
   */
  public static async getStorageUsage(): Promise<StorageUsageStats> {
    const dbBytes=getDb().byteLength();
    const assets=typeof indexedDB==='undefined'?[]:await listMediaAssets();
    const audio=assets.filter(a=>a.blob.type.startsWith('audio/'));
    const other=assets.filter(a=>!a.blob.type.startsWith('audio/'));
    const categories:StorageCategoryStats[]=[
      {id:'database',name:'SQLite (görsel ve materyal kayıtları dahil)',bytes:dbBytes,formatted:formatBytes(dbBytes),fileCount:1,color:'#315efb'},
      {id:'narration',name:'Kayıtlı ses dosyaları',bytes:audio.reduce((n,a)=>n+a.blob.size,0),formatted:'',fileCount:audio.length,color:'#059669'},
      {id:'materials',name:'Diğer medya dosyaları',bytes:other.reduce((n,a)=>n+a.blob.size,0),formatted:'',fileCount:other.length,color:'#7c3aed'}
    ].map(c=>({...c,formatted:formatBytes(c.bytes)}));
    const usedBytes=categories.reduce((n,c)=>n+c.bytes,0);
    let totalBytes=0,freeBytes=0;
    if(typeof navigator!=='undefined'&&navigator.storage?.estimate){try{const estimate=await navigator.storage.estimate();totalBytes=estimate.quota||0;freeBytes=Math.max(0,totalBytes-(estimate.usage||0));}catch{/* Quota unavailable; never invent drive capacity. */}}
    return {totalBytes,usedBytes,freeBytes,usedPercent:totalBytes?Math.round(usedBytes/totalBytes*100):0,isWarningLowSpace:totalBytes>0&&freeBytes<50*1024*1024,warningThresholdMb:50,categories,itemCount:assets.length+1};
  }

  /**
   * Get sorted list of largest files stored on the device for inspection and cleanup.
   */
  public static async getLargeFilesList(limit = 15): Promise<LargeFileInfo[]> {
    const list: LargeFileInfo[] = [];
    const db = getDb();

    // 1. Database file entry
    list.push({
      id: 'sqlite_main_database',
      name: 'ders_companion_sqlite_v1.db (Ana Veritabanı)',
      category: 'database',
      categoryLabel: 'Veritabanı',
      sizeBytes: (await this.getStorageUsage()).categories[0].bytes,
      formattedSize: (await this.getStorageUsage()).categories[0].formatted,
      createdAt: 'Sürekli güncel',
      canDelete: false // Core database cannot be deleted directly
    });

    // 2. Material library items
    try {
      const materials = db.query<any>('SELECT * FROM material_library ORDER BY version DESC LIMIT 10');
      for (const m of materials) {
        const estSize = new TextEncoder().encode(JSON.stringify(m)).length;
        list.push({
          id: m.id,
          name: `${m.title} (${m.content_type.toUpperCase()} v${m.version})`,
          category: 'materials',
          categoryLabel: 'Materyal kaydı (dosya hariç)',
          sizeBytes: estSize,
          formattedSize: formatBytes(estSize),
          createdAt: m.created_at ? new Date(m.created_at).toLocaleDateString('tr-TR') : 'Bilinmiyor',
          canDelete: true
        });
      }
    } catch {
      // ignore
    }

    // 3. Visuals cache
    try {
      const visuals = db.query<any>('SELECT * FROM educational_visual_cache LIMIT 10');
      for (const v of visuals) {
        const size = v.svg_or_data ? new TextEncoder().encode(v.svg_or_data).length : 0;
        list.push({
          id: v.id,
          name: `Ders Görseli [${v.topic_id}] (${v.model_name})`,
          category: 'visuals',
          categoryLabel: 'Görsel Şema',
          sizeBytes: size,
          formattedSize: formatBytes(size),
          createdAt: v.created_at ? new Date(v.created_at).toLocaleDateString('tr-TR') : 'Bilinmiyor',
          canDelete: true
        });
      }
    } catch {
      // ignore
    }

    // Sort descending by sizeBytes
    list.sort((a, b) => b.sizeBytes - a.sizeBytes);
    return list.slice(0, limit);
  }

  /**
   * Delete a specific file or asset safely from local storage.
   */
  public static async deleteStoredFile(id: string, category: string): Promise<boolean> {
    const db = getDb();
    try {
      if (category === 'materials') {
        db.execute('DELETE FROM material_library WHERE id = ?', [id]);
        return true;
      }
      if (category === 'visuals') {
        db.execute('DELETE FROM educational_visual_cache WHERE id = ?', [id]);
        return true;
      }
      if (category === 'media_jobs') {
        const jobs = readSetting<any[]>('media_jobs', []);
        const filtered = jobs.filter(j => j.id !== id);
        writeSetting('media_jobs', filtered);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Dosya silinemedi:', err);
      return false;
    }
  }

  /**
   * Validate new target storage location for accessibility, writability and space.
   */
  public static validateDestination(targetPath: string): {
    valid: boolean;
    error?: string;
    detectedType: StorageType;
  } {
    const trimmed = targetPath.trim();
    if (!trimmed) {
      return { valid: false, error: 'Depolama yolu boş bırakılamaz.', detectedType: 'local_custom' };
    }

    // Check path format (Windows drive or relative / network path)
    const isWindowsAbsolute = /^[a-zA-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$/.test(trimmed);
    const isNetworkShare = /^\\\\[a-zA-Z0-9._-]+\\[a-zA-Z0-9._$-]+/.test(trimmed);

    let detectedType: StorageType = 'local_custom';
    if (isNetworkShare) {
      detectedType = 'network_share';
    } else if (isWindowsAbsolute) {
      const driveLetter = trimmed.charAt(0).toUpperCase();
      // Drives other than C: are usually external disks or secondary drives
      detectedType = driveLetter !== 'C' ? 'external_disk' : 'local_custom';
    } else {
      return {
        valid: false,
        error: 'Geçerli bir Windows dosya yolu veya ağ konumu giriniz (örn: D:\\DersProgramiDepo veya C:\\EgitimVerileri).',
        detectedType: 'local_custom'
      };
    }

    return { valid: true, detectedType };
  }

  /**
   * Prepare a detailed migration plan calculating required size, items, and verification checks.
   */
  public static async prepareMigrationPlan(targetPath: string): Promise<MigrationPlan> {
    const validation = this.validateDestination(targetPath);
    if (!validation.valid) {
      throw new Error(validation.error || 'Geçersiz hedef depolama konumu.');
    }

    const currentLoc = this.getStorageLocation();
    if (currentLoc.path.toLowerCase() === targetPath.trim().toLowerCase()) {
      throw new Error('Hedef konum ile mevcut konum aynıdır.');
    }

    const usage = await this.getStorageUsage();
    const items: Array<{ id: string; category: string; sizeBytes: number }> = [];

    // Collect all items
    for (const cat of usage.categories) {
      items.push({
        id: `bundle_${cat.id}`,
        category: cat.id,
        sizeBytes: cat.bytes
      });
    }

    // 20% safety margin buffer
    const requiredFreeSpaceBytes = Math.round(usage.usedBytes * 1.2);
    const estimatedSeconds = Math.max(2, Math.round(usage.usedBytes / (5 * 1024 * 1024))); // ~5 MB/s transfer speed

    return {
      planId: `mig_${Date.now()}`,
      sourcePath: currentLoc.path,
      targetPath: targetPath.trim(),
      targetType: validation.detectedType,
      totalSizeBytes: usage.usedBytes,
      totalItemCount: usage.itemCount,
      requiredFreeSpaceBytes,
      estimatedSeconds,
      items
    };
  }

  /**
   * Execute safe migration flow:
   * 1. Validate writability & accessibility
   * 2. Transfer data with integrity checks
   * 3. Switch active location pointer
   * 4. Keep old files safe until explicit user cleanup
   */
  public static async executeMigration(
    plan: MigrationPlan,
    onProgress?: (percent: number, stepText: string) => void
  ): Promise<MigrationResult> {
    void plan; void onProgress;
    throw new Error('Klasör taşıma bu sürümde desteklenmiyor. Veriler taşınmadı. JSON yedeği ve medya dosyalarını dışa aktarın.');
  }

  /**
   * Explicit confirmation cleanup for old storage location after successful migration.
   */
  public static confirmCleanupOldStorage(oldPath: string): { success: boolean; message: string } {
    void oldPath;
    return {success:false,message:'Dosya silinmedi. Fiziksel klasör temizliği desteklenmiyor.'};
  }

  /**
   * Create a full unified JSON snapshot containing all DB tables and storage metadata.
   */
  public static createFullStorageSnapshot(): { json: string; filename: string } {
    const dbDump = exportDatabaseToJson();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `derspusulasi_tam_yedek_${dateStr}.json`;
    return { json: dbDump, filename };
  }

  /**
   * Restore full snapshot from JSON with rollback protection.
   */
  public static restoreFullStorageSnapshot(content: string): { success: boolean; message: string } {
    return importDatabaseFromJson(content);
  }
}
