import { getDb } from './database';

export interface DatabaseDump {
  version: number;
  exported_at: string;
  tables: {
    student_profile: any[];
    subjects: any[];
    topics: any[];
    questions: any[];
    study_sessions: any[];
    answer_attempts: any[];
    topic_mastery: any[];
    review_schedule: any[];
    conversation_summaries: any[];
    ai_usage: any[];
    app_settings: any[];
  };
}

export function exportDatabaseToJson(): string {
  const db = getDb();
  const dump: DatabaseDump = { version: 2, exported_at: new Date().toISOString(), tables: {} as DatabaseDump['tables'] };
  for (const table of backupTables()) {
    (dump.tables as Record<string, any[]>)[table] = db.query(`SELECT * FROM "${table}"`)
      .filter(row => table !== 'app_settings' || !isSecret(row.key));
  }

  return JSON.stringify(dump, null, 2);
}

const isSecret = (key: string) => /api.?key|token|password|secret/i.test(key);
function backupTables(): string[] {
  return getDb().query<{name: string}>("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'schema_migrations'").map(r => r.name);
}

export function importDatabaseFromJson(content: string): { success: boolean; message: string } {
  const db = getDb();
  const raw = db.getRawDatabase();
  let started = false;
  try {
    const data = JSON.parse(content);
    if (![1, 2].includes(data.version) || !data.tables || typeof data.tables !== 'object' || Array.isArray(data.tables)) throw new Error('format');
    const entries = Object.entries(data.tables) as [string, Record<string, any>[]][];
    const allowed = backupTables();
    if (!entries.length) throw new Error('empty');
    for (const [table, rows] of entries) {
      if (!allowed.includes(table) || !Array.isArray(rows)) throw new Error('table');
      const columns = db.query<{name: string}>(`PRAGMA table_info("${table}")`).map(c => c.name);
      for (const row of rows) {
        if (!row || typeof row !== 'object' || Array.isArray(row) || !Object.keys(row).length || Object.keys(row).some(k => !columns.includes(k))) throw new Error('column');
        if (Object.values(row).some(v => v !== null && !['string', 'number'].includes(typeof v))) throw new Error('value');
      }
    }
    raw.run('BEGIN TRANSACTION');
    started = true;
    raw.run('PRAGMA defer_foreign_keys = ON');
    for (const [table, rows] of entries) {
      if (table === 'app_settings') {
        for (const row of db.query<{key: string}>('SELECT key FROM app_settings')) {
          if (!isSecret(row.key)) raw.run('DELETE FROM app_settings WHERE key = ?', [row.key]);
        }
      } else raw.run(`DELETE FROM "${table}"`);
      for (const row of rows) {
        if (table === 'app_settings' && isSecret(row.key)) continue;
        const keys = Object.keys(row);
        raw.run(`INSERT INTO "${table}" (${keys.map(k => '"' + k + '"').join(',')}) VALUES (${keys.map(() => '?').join(',')})`, Object.values(row));
      }
    }
    raw.run('COMMIT');
    started = false;
    db.persist();
    return { success: true, message: 'Yedek geri yüklendi. Güncel veriler için uygulamayı yeniden açın.' };
  } catch {
    if (started) raw.run('ROLLBACK');
    return { success: false, message: 'Yedek geri yüklenemedi. Mevcut veriler korundu; dosyayı kontrol edin.' };
  }
}

export function exportTableToCsv(tableName: string): string {
  const db = getDb();
  if (!backupTables().includes(tableName) || tableName === 'app_settings') throw new Error('Bu tablo dışa aktarılamaz.');
  const rows = db.query(`SELECT * FROM "${tableName}"`);
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const csvLines: string[] = [];
  csvLines.push(headers.map(h => `"${h}"`).join(','));

  for (const row of rows) {
    const line = headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '""';
      const safe = /^[\s]*[=+\-@]/.test(String(val)) ? "'" + String(val) : String(val);
      const str = safe.replace(/"/g, '""');
      return `"${str}"`;
    }).join(',');
    csvLines.push(line);
  }

  return csvLines.join('\n');
}
