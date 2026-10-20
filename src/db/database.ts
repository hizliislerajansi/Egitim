import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { MIGRATIONS } from './schema';

export class AppDatabase {
  private static instance: AppDatabase | null = null;
  private db: SqlJsDatabase | null = null;
  private isInitialized = false;
  private transactionDepth = 0;
  private storageKey = 'ders_companion_sqlite_v1';

  private constructor() {}

  public static getInstance(): AppDatabase {
    if (!AppDatabase.instance) {
      AppDatabase.instance = new AppDatabase();
    }
    return AppDatabase.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    try {
      let SQL: any;

      // Node.js (test) veya Tarayıcı/Webview ortam kontrolü
      if (typeof window === 'undefined' || typeof process !== 'undefined' && process.versions?.node) {
        try {
          const fs = await import('fs');
          const path = await import('path');
          const wasmPath = path.resolve(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm');
          const fileBuffer = fs.readFileSync(wasmPath);
          const wasmBinary = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
          SQL = await initSqlJs({ wasmBinary: wasmBinary as any });
        } catch {
          SQL = await initSqlJs();
        }
      } else {
        SQL = await initSqlJs({
          locateFile: (file) => file.endsWith('.wasm') ? '/sql-wasm.wasm' : `https://sql.js.org/dist/sql-wasm.wasm`
        });
      }

      // LocalStorage kontrolü (varsa yükle)
      let loadedDb: SqlJsDatabase | null = null;
      if (typeof localStorage !== 'undefined') {
        const savedDb = localStorage.getItem(this.storageKey);
        if (savedDb) {
          try {
            const binary = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
            loadedDb = new SQL.Database(binary);
          } catch {
            throw new Error('Kaydedilmiş veritabanı açılamadı. Veri kaybını önlemek için başlatma durduruldu.');
          }
        }
      }

      this.db = loadedDb || new SQL.Database();
      this.isInitialized = true;
      await this.runMigrations();
      this.persist();
    } catch (err) {
      this.isInitialized = false;
      throw err;
    }
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) return;

    // Migrations tablosu oluştur
    this.db.run(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );
    `);

    // Uygulanmış sürümleri al
    const res = this.db.exec("SELECT version FROM schema_migrations");
    const appliedVersions = new Set<number>();
    if (res.length > 0 && res[0].values) {
      for (const row of res[0].values) {
        appliedVersions.add(row[0] as number);
      }
    }

    // Uygulanmamış migration'ları sırayla çalıştır
    for (const migration of MIGRATIONS) {
      if (!appliedVersions.has(migration.version)) {
        this.db.run('BEGIN TRANSACTION');
        try {
        this.db.run(migration.sql);
        this.db.run(
          "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
          [migration.version, migration.name, new Date().toISOString()]
        );
        this.db.run('COMMIT');
        } catch(error) { this.db.run('ROLLBACK'); throw error; }
      }
    }
  }

  private persistenceError=false;
  public getPersistenceError():boolean{return this.persistenceError;}
  public persist(): void {
    if (this.transactionDepth > 0) return;
    if (!this.db) return;
    if (typeof localStorage === 'undefined') return;

    try {
      const binary = this.db.export();
      let binaryString = '';
      const len = binary.byteLength;
      for (let i = 0; i < len; i++) {
        binaryString += String.fromCharCode(binary[i]);
      }
      localStorage.setItem(this.storageKey, btoa(binaryString));
      this.persistenceError=false;
    } catch (e) {
      this.persistenceError=true;
      console.warn('Could not persist SQLite to localStorage:', e);
    }
  }

  public byteLength(): number {
    return this.db?.export().byteLength || 0;
  }

  public transaction<T>(operation: () => T): T {
    if (!this.db) throw new Error('Database not initialized');
    if (this.transactionDepth) return operation();
    this.db.run('BEGIN TRANSACTION');
    this.transactionDepth = 1;
    let result: T;
    try { result = operation(); this.db.run('COMMIT'); }
    catch (error) { this.db.run('ROLLBACK'); throw error; }
    finally { this.transactionDepth = 0; }
    this.persist();
    return result;
  }

  public execute(sql: string, params: any[] = []): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.run(sql, params);
    this.persist();
  }

  public run(sql: string, params: any[] = []): void {
    this.execute(sql, params);
  }

  public query<T = any>(sql: string, params: any[] = []): T[] {
    if (!this.db) throw new Error('Database not initialized');
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    stmt.free();
    return results;
  }

  public queryOne<T = any>(sql: string, params: any[] = []): T | null {
    const list = this.query<T>(sql, params);
    return list.length > 0 ? list[0] : null;
  }

  public getRawDatabase(): SqlJsDatabase {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  public async resetDatabase(): Promise<void> {
    if (!this.db) return;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
    this.isInitialized = false;
    await this.initialize();
  }
}

export const getDb = (): AppDatabase => AppDatabase.getInstance();
