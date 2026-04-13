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
      create_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      team VARCHAR(255),
      display_name VARCHAR(255),
      update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `;
    await this.pool.query(createTableSQL);
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

  async getLatestUpdateTime(): Promise<string | null> {
    const stmt = `SELECT MAX(update_at) as latest_update FROM premium_usage_report`;
    const result = await this.pool.query(stmt);
    return result.rows[0]?.latest_update || null;
  }

  async close() {
    await this.pool.end();
  }
}

export default PremiumRequestUsageService;