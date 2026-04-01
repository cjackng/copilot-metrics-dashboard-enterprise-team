import { Pool } from 'pg';
import { PremiumRequestUsage } from '@/features/common/models';

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
    CREATE TABLE IF NOT EXISTS copilot_premium_request_usage (
      date TEXT NOT NULL,
      username TEXT NOT NULL,
      product TEXT NOT NULL,
      sku TEXT NOT NULL,
      model TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_type TEXT NOT NULL,
      applied_cost_per_quantity REAL NOT NULL,
      gross_amount REAL NOT NULL,
      discount_amount REAL NOT NULL,
      net_amount REAL NOT NULL,
      exceeds_quota BOOLEAN NOT NULL DEFAULT FALSE,
      total_monthly_quota INTEGER NOT NULL,
      organization TEXT,
      cost_center_name TEXT,
      PRIMARY KEY (date, username, sku)
    );
    `;
    await this.pool.query(createTableSQL);
  }

  async insertRow(row: PremiumRequestUsage) {
    const stmt = `
      INSERT INTO copilot_premium_request_usage (
        date, username, product, sku, model, quantity, unit_type,
        applied_cost_per_quantity, gross_amount, discount_amount, net_amount,
        exceeds_quota, total_monthly_quota, organization, cost_center_name
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
      ON CONFLICT (date, username, sku) DO UPDATE SET
        product = EXCLUDED.product,
        model = EXCLUDED.model,
        quantity = EXCLUDED.quantity,
        unit_type = EXCLUDED.unit_type,
        applied_cost_per_quantity = EXCLUDED.applied_cost_per_quantity,
        gross_amount = EXCLUDED.gross_amount,
        discount_amount = EXCLUDED.discount_amount,
        net_amount = EXCLUDED.net_amount,
        exceeds_quota = EXCLUDED.exceeds_quota,
        total_monthly_quota = EXCLUDED.total_monthly_quota,
        organization = EXCLUDED.organization,
        cost_center_name = EXCLUDED.cost_center_name
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

  async getAllRows(): Promise<PremiumRequestUsage[]> {
    const result = await this.pool.query('SELECT * FROM copilot_premium_request_usage');
    return result.rows;
  }

  async close() {
    await this.pool.end();
  }
}

export default PremiumRequestUsageService;