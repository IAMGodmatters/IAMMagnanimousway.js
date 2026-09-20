import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const meta = (extra = {}) => ({ served_by: 'magnanimous-sql', served_by_primary: true, ...extra });

class MagnanimousPreparedStatement {
  constructor(owner, sql, params = []) {
    this.owner = owner;
    this.sql = String(sql);
    this.params = [...params];
  }

  bind(...params) {
    return new MagnanimousPreparedStatement(this.owner, this.sql, params);
  }

  _statement() {
    return this.owner.db.prepare(this.sql);
  }

  _runSync() {
    const result = this._statement().run(...this.params);
    return {
      success: true,
      meta: meta({
        changes: Number(result.changes || 0),
        last_row_id: Number(result.lastInsertRowid || 0),
        rows_read: 0,
        rows_written: Number(result.changes || 0)
      })
    };
  }

  async run() {
    return this._runSync();
  }

  async first(column) {
    const row = this._statement().get(...this.params) ?? null;
    if (row == null) return null;
    return column === undefined ? row : row?.[column] ?? null;
  }

  async all() {
    const results = this._statement().all(...this.params);
    return {
      success: true,
      results,
      meta: meta({ changes: 0, rows_read: results.length, rows_written: 0 })
    };
  }

  async raw() {
    const rows = this._statement().all(...this.params);
    return rows.map((row) => Object.values(row));
  }
}

export class MagnanimousSqlBinding {
  constructor(databasePath) {
    const resolved = path.resolve(databasePath);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    this.path = resolved;
    this.db = new DatabaseSync(resolved);
    this.db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  }

  prepare(sql) {
    return new MagnanimousPreparedStatement(this, sql);
  }

  async batch(statements) {
    if (!Array.isArray(statements)) throw new TypeError('batch expects an array of prepared statements');
    const output = [];
    this.db.exec('BEGIN IMMEDIATE');
    try {
      for (const statement of statements) {
        if (!(statement instanceof MagnanimousPreparedStatement) || statement.owner !== this) {
          throw new TypeError('batch accepts only statements prepared by this database binding');
        }
        output.push(statement._runSync());
      }
      this.db.exec('COMMIT');
      return output;
    } catch (error) {
      try { this.db.exec('ROLLBACK'); } catch {}
      throw error;
    }
  }

  async exec(sql) {
    this.db.exec(String(sql));
    return { count: 0, duration: 0 };
  }

  close() {
    this.db.close();
  }
}

export function openMagnanimousDb(databasePath = process.env.MAGNANIMOUS_DB_PATH || './data/iam-magnanimous.sqlite') {
  return new MagnanimousSqlBinding(databasePath);
}
