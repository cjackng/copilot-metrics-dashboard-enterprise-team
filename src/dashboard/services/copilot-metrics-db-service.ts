import { Pool, PoolClient } from 'pg';
import format from 'pg-format';
import { CopilotMetricsReportData } from '@/features/common/models';

class CopilotMetricsDbService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async init() {
    const sql = `
      CREATE TABLE IF NOT EXISTS copilot_metrics_daily (
        day DATE NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        user_login VARCHAR(255) NOT NULL,
        user_initiated_interaction_count INT,
        code_generation_activity_count INT,
        code_acceptance_activity_count INT,
        totals_by_ide JSONB,
        totals_by_feature JSONB,
        totals_by_language_feature JSONB,
        totals_by_language_model JSONB,
        totals_by_model_feature JSONB,
        used_agent BOOLEAN,
        used_chat BOOLEAN,
        loc_suggested_to_add_sum INT,
        loc_suggested_to_delete_sum INT,
        loc_added_sum INT,
        loc_deleted_sum INT,
        used_cli BOOLEAN,
        used_copilot_coding_agent BOOLEAN,
        create_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        update_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT copilot_metrics_daily_pk UNIQUE (day, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_metrics_day ON copilot_metrics_daily(day);
      CREATE INDEX IF NOT EXISTS idx_metrics_userid ON copilot_metrics_daily(user_id);
    `;
    await this.pool.query(sql);
  }

  async upsertBatch(rows: CopilotMetricsReportData[]) {
    if (rows.length === 0) return;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      console.log(`[CopilotMetrics-DB] Starting transaction for ${rows.length} records`);

      const batchSize = 1000;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        console.log(`[CopilotMetrics-DB] Upserting batch ${i + 1}–${i + batch.length}`);
        await this.processBatch(client, batch);
      }

      await client.query('COMMIT');
      console.log(`[CopilotMetrics-DB] Transaction committed for ${rows.length} records`);
    } catch (error) {
      console.error('[CopilotMetrics-DB] Error during upsert, rolling back transaction', error);
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async processBatch(client: PoolClient, batch: CopilotMetricsReportData[]) {
    const values = batch.map((row) => [
      row.day,
      row.user_id,
      row.user_login,
      row.user_initiated_interaction_count ?? 0,
      row.code_generation_activity_count ?? 0,
      row.code_acceptance_activity_count ?? 0,
      JSON.stringify(row.totals_by_ide ?? []),
      JSON.stringify(row.totals_by_feature ?? []),
      JSON.stringify(row.totals_by_language_feature ?? []),
      JSON.stringify(row.totals_by_language_model ?? []),
      JSON.stringify(row.totals_by_model_feature ?? []),
      row.used_agent ?? false,
      row.used_chat ?? false,
      row.loc_suggested_to_add_sum ?? 0,
      row.loc_suggested_to_delete_sum ?? 0,
      row.loc_added_sum ?? 0,
      row.loc_deleted_sum ?? 0,
      row.used_cli ?? false,
      row.used_copilot_coding_agent ?? false,
    ]);

    const insertStmt = format(
      `
      INSERT INTO copilot_metrics_daily (
        day, user_id, user_login,
        user_initiated_interaction_count, code_generation_activity_count, code_acceptance_activity_count,
        totals_by_ide, totals_by_feature, totals_by_language_feature,
        totals_by_language_model, totals_by_model_feature,
        used_agent, used_chat,
        loc_suggested_to_add_sum, loc_suggested_to_delete_sum,
        loc_added_sum, loc_deleted_sum,
        used_cli, used_copilot_coding_agent
      ) VALUES %L
      ON CONFLICT (day, user_id) DO UPDATE SET
        user_login                        = EXCLUDED.user_login,
        user_initiated_interaction_count  = EXCLUDED.user_initiated_interaction_count,
        code_generation_activity_count    = EXCLUDED.code_generation_activity_count,
        code_acceptance_activity_count    = EXCLUDED.code_acceptance_activity_count,
        totals_by_ide                     = EXCLUDED.totals_by_ide,
        totals_by_feature                 = EXCLUDED.totals_by_feature,
        totals_by_language_feature        = EXCLUDED.totals_by_language_feature,
        totals_by_language_model          = EXCLUDED.totals_by_language_model,
        totals_by_model_feature           = EXCLUDED.totals_by_model_feature,
        used_agent                        = EXCLUDED.used_agent,
        used_chat                         = EXCLUDED.used_chat,
        loc_suggested_to_add_sum          = EXCLUDED.loc_suggested_to_add_sum,
        loc_suggested_to_delete_sum       = EXCLUDED.loc_suggested_to_delete_sum,
        loc_added_sum                     = EXCLUDED.loc_added_sum,
        loc_deleted_sum                   = EXCLUDED.loc_deleted_sum,
        used_cli                          = EXCLUDED.used_cli,
        used_copilot_coding_agent         = EXCLUDED.used_copilot_coding_agent,
        update_at                         = NOW()
    `,
      values,
    );

    await client.query(insertStmt);
  }

  async getByDateRange(startDate: string, endDate: string): Promise<CopilotMetricsReportData[]> {
    const result = await this.pool.query(
      `SELECT * FROM copilot_metrics_daily WHERE day BETWEEN $1 AND $2 ORDER BY day`,
      [startDate, endDate],
    );
    return result.rows.map((row) => ({
      ...row,
      day: row.day instanceof Date
        ? `${row.day.getFullYear()}-${String(row.day.getMonth() + 1).padStart(2, "0")}-${String(row.day.getDate()).padStart(2, "0")}`
        : String(row.day),
      totals_by_ide: row.totals_by_ide ?? [],
      totals_by_feature: row.totals_by_feature ?? [],
      totals_by_language_feature: row.totals_by_language_feature ?? [],
      totals_by_language_model: row.totals_by_language_model ?? [],
      totals_by_model_feature: row.totals_by_model_feature ?? [],
      report_start_day: startDate,
      report_end_day: endDate,
    }));
  }

  /** Returns the latest day stored, or null if the table is empty (first run). */
  async getLatestDay(): Promise<string | null> {
    const result = await this.pool.query(
      `SELECT MAX(day)::text AS latest_day FROM copilot_metrics_daily`,
    );
    return result.rows[0]?.latest_day ?? null;
  }

  async getLatestUpdateTime(): Promise<Date | null> {
    const result = await this.pool.query(
      `SELECT MAX(update_at) AS latest_update FROM copilot_metrics_daily`,
    );
    return result.rows[0]?.latest_update ?? null;
  }

  async close() {
    await this.pool.end();
  }
}

export default CopilotMetricsDbService;
