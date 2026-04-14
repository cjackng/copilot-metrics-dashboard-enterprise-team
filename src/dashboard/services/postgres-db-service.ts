import { Pool } from 'pg';
import { PremiumRequestUsage } from '@/features/common/models';
import format from 'pg-format'

class PremiumRequestUsageService {
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
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS premium_usage_report (
      date DATE NOT NULL,
      username VARCHAR(255) NOT NULL,
      product VARCHAR(100) NOT NULL,
      sku VARCHAR(100) NOT NULL,
      model VARCHAR(255) NOT NULL,
      quantity DECIMAL(30,17) NOT NULL,
      unit_type VARCHAR(50) NOT NULL,
      applied_cost_per_quantity DECIMAL(10,4) NOT NULL,
      gross_amount DECIMAL(30,17) NOT NULL,
      discount_amount DECIMAL(30,17) NOT NULL,
      net_amount DECIMAL(30,17) NOT NULL,
      exceeds_quota BOOLEAN NOT NULL,
      total_monthly_quota INTEGER,
      organization VARCHAR(255),
      cost_center_name VARCHAR(255),
      create_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    `;
    await this.pool.query(createTableSQL);
  }

  async insertOrUpdateRow(row: PremiumRequestUsage) {
    const stmt = `
      INSERT INTO premium_usage_report (
        date, username, product, sku, model, quantity, unit_type,
        applied_cost_per_quantity, gross_amount, discount_amount, net_amount,
        exceeds_quota, total_monthly_quota, organization, cost_center_name,
        update_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
      ON CONFLICT (date, username, sku, unit_type, model, exceeds_quota, team) 
      DO UPDATE SET
        product = EXCLUDED.product,
        model = EXCLUDED.model,
        quantity = EXCLUDED.quantity,
        applied_cost_per_quantity = EXCLUDED.applied_cost_per_quantity,
        gross_amount = EXCLUDED.gross_amount,
        discount_amount = EXCLUDED.discount_amount,
        net_amount = EXCLUDED.net_amount,
        total_monthly_quota = EXCLUDED.total_monthly_quota,
        organization = EXCLUDED.organization,
        cost_center_name = EXCLUDED.cost_center_name,
        update_at = NOW()
    `;

    await this.pool.query(stmt, [
      row.date,
      row.username,
      row.product,
      row.sku,
      row.model,
      row.quantity,
      row.unit_type,
      row.applied_cost_per_quantity,
      row.gross_amount,
      row.discount_amount,
      row.net_amount,
      row.exceeds_quota,
      row.total_monthly_quota,
      row.organization || null,
      row.cost_center_name || null,
    ]);
  }

  // Batch insert or update method
  async insertOrUpdateBatch(rows: PremiumRequestUsage[]) {
    if (rows.length === 0) return;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      console.log(`[DB Service] Starting batch insert/update for ${rows.length} records`);
      // Process in batches to avoid too many parameters
      const batchSize = 1000;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        console.log(`[DB Service] Processing batch ${i + 1} - ${i + batch.length}`);
        await this.processBatch(batch);
      }
      console.log(`[DB Service] Batch insert/update completed for ${rows.length} records`);
      await client.query('COMMIT');
    } catch (error) {
      console.error('[DB Service] Error during batch insert/update, rolling back transaction', error);
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async processBatch(batch: PremiumRequestUsage[]) {
    // Build parameters array
    const values = batch.map(row => [
      row.date,
      row.username,
      row.product,
      row.sku,
      row.model,
      row.quantity,
      row.unit_type,
      row.applied_cost_per_quantity,
      row.gross_amount,
      row.discount_amount,
      row.net_amount,
      row.exceeds_quota,
      row.total_monthly_quota,
      row.organization || null,
      row.cost_center_name || null,
      new Date(),
    ]);

    const insertStmt = format(`
      INSERT INTO premium_usage_report (
        date, username, product, sku, model, quantity, unit_type,
        applied_cost_per_quantity, gross_amount, discount_amount, net_amount,
        exceeds_quota, total_monthly_quota, organization, cost_center_name,
        update_at
      ) VALUES %L
      ON CONFLICT (date, username, sku, model, unit_type, exceeds_quota, team) 
      DO UPDATE SET
        product = EXCLUDED.product,
        model = EXCLUDED.model,
        quantity = EXCLUDED.quantity,
        applied_cost_per_quantity = EXCLUDED.applied_cost_per_quantity,
        gross_amount = EXCLUDED.gross_amount,
        discount_amount = EXCLUDED.discount_amount,
        net_amount = EXCLUDED.net_amount,
        total_monthly_quota = EXCLUDED.total_monthly_quota,
        organization = EXCLUDED.organization,
        cost_center_name = EXCLUDED.cost_center_name,
        update_at = NOW()
    `, values);

    await this.pool.query(insertStmt);
  }

  async getAllRows(): Promise<PremiumRequestUsage[]> {
    const result = await this.pool.query('SELECT * FROM premium_usage_report');
    return result.rows;
  }

  async getRowsByDateRange(startDate: string, endDate: string): Promise<PremiumRequestUsage[]> {
    const stmt = `
      SELECT * FROM premium_usage_report
      WHERE date >= $1 AND date <= $2
    `;
    const result = await this.pool.query(stmt, [startDate, endDate]);
    return result.rows;
  }

  async close() {
    await this.pool.end();
  }
}

export default PremiumRequestUsageService;