import { Pool, PoolClient } from 'pg';
import format from 'pg-format';
import { SeatSnapshotRow, SeatsDBResult } from './copilot-seat-service';

export interface SeatSnapshotInsertRow {
  snapshot_date: string;   // YYYY-MM-DD
  username: string;        // assignee.login
  display_username: string | null;
  organization: string | null;
  team: string | null;
  plan_type: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_activity_at: string | null;
  last_activity_editor: string | null;
  pending_cancellation_date: string | null;
}

class CopilotSeatsDbService {
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
      CREATE TABLE IF NOT EXISTS copilot_seats_snapshot (
        snapshot_date DATE NOT NULL,
        username VARCHAR(255) NOT NULL,
        display_username VARCHAR(255),
        organization VARCHAR(255),
        team VARCHAR(255),
        plan_type VARCHAR(100),
        created_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ,
        last_activity_at TIMESTAMPTZ,
        last_activity_editor VARCHAR(255),
        pending_cancellation_date DATE,
        create_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT copilot_seats_snapshot_pk UNIQUE (snapshot_date, username)
      );
      CREATE INDEX IF NOT EXISTS idx_seats_snapshot_date ON copilot_seats_snapshot(snapshot_date);
    `;
    await this.pool.query(sql);
  }

  async upsertBatch(rows: SeatSnapshotInsertRow[]) {
    if (rows.length === 0) return;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      console.log(`[CopilotSeats-DB] Starting transaction for ${rows.length} records`);

      const batchSize = 1000;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        console.log(`[CopilotSeats-DB] Upserting batch ${i + 1}–${i + batch.length}`);
        await this.processBatch(client, batch);
      }

      await client.query('COMMIT');
      console.log(`[CopilotSeats-DB] Transaction committed for ${rows.length} records`);
    } catch (error) {
      console.error('[CopilotSeats-DB] Error during upsert, rolling back transaction', error);
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async processBatch(client: PoolClient, batch: SeatSnapshotInsertRow[]) {
    const values = batch.map((row) => [
      row.snapshot_date,
      row.username,
      row.display_username ?? null,
      row.organization ?? null,
      row.team ?? null,
      row.plan_type ?? null,
      row.created_at ?? null,
      row.updated_at ?? null,
      row.last_activity_at ?? null,
      row.last_activity_editor ?? null,
      row.pending_cancellation_date ?? null,
    ]);

    const insertStmt = format(
      `
      INSERT INTO copilot_seats_snapshot (
        snapshot_date, username, display_username,
        organization, team, plan_type,
        created_at, updated_at,
        last_activity_at, last_activity_editor,
        pending_cancellation_date
      ) VALUES %L
      ON CONFLICT (snapshot_date, username) DO UPDATE SET
        display_username         = EXCLUDED.display_username,
        organization             = EXCLUDED.organization,
        team                     = EXCLUDED.team,
        plan_type                = EXCLUDED.plan_type,
        created_at               = EXCLUDED.created_at,
        updated_at               = EXCLUDED.updated_at,
        last_activity_at         = EXCLUDED.last_activity_at,
        last_activity_editor     = EXCLUDED.last_activity_editor,
        pending_cancellation_date = EXCLUDED.pending_cancellation_date
      `,
      values,
    );

    await client.query(insertStmt);
  }

  /**
   * Returns the snapshot closest to (≤) the given date, plus active seat count.
   * Active seats = last_activity_at within 30 days before `date`.
   */
  async getByDate(date: string): Promise<SeatsDBResult> {
    // Find the actual snapshot date used (closest ≤ requested date)
    const snapshotDateResult = await this.pool.query(
      `SELECT MAX(snapshot_date)::text AS snapshot_date
       FROM copilot_seats_snapshot
       WHERE snapshot_date <= $1`,
      [date],
    );
    const snapshotDate: string | null = snapshotDateResult.rows[0]?.snapshot_date ?? null;

    if (!snapshotDate) {
      return { seats: [], total_seats: 0, total_active_seats: 0, snapshot_date: null, snapshot_time: null, last_update_time: null };
    }

    const [seatsResult, timesResult] = await Promise.all([
      this.pool.query(
        `SELECT
           username, display_username, organization, team, plan_type,
           created_at, updated_at, last_activity_at, last_activity_editor,
           pending_cancellation_date
         FROM copilot_seats_snapshot
         WHERE snapshot_date = $1
         ORDER BY username`,
        [snapshotDate],
      ),
      this.pool.query(
        `SELECT
           MAX(create_at) FILTER (WHERE snapshot_date = $1) AS snapshot_time,
           MAX(create_at) AS last_update
         FROM copilot_seats_snapshot`,
        [snapshotDate],
      ),
    ]);

    const seats: SeatSnapshotRow[] = seatsResult.rows.map((r) => ({
      username: r.username,
      display_username: r.display_username ?? null,
      organization: r.organization ?? null,
      team: r.team ?? null,
      plan_type: r.plan_type ?? null,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : null,
      last_activity_at: r.last_activity_at ? new Date(r.last_activity_at).toISOString() : null,
      last_activity_editor: r.last_activity_editor ?? null,
      pending_cancellation_date: r.pending_cancellation_date
        ? new Date(r.pending_cancellation_date).toISOString().slice(0, 10)
        : null,
    }));

    const thirtyDaysBeforeDate = new Date(date);
    thirtyDaysBeforeDate.setDate(thirtyDaysBeforeDate.getDate() - 30);
    const activeSeats = seats.filter(
      (s) => s.last_activity_at && new Date(s.last_activity_at) >= thirtyDaysBeforeDate,
    );

    return {
      seats,
      total_seats: seats.length,
      total_active_seats: activeSeats.length,
      snapshot_date: snapshotDate,
      snapshot_time: timesResult.rows[0]?.snapshot_time ?? null,
      last_update_time: timesResult.rows[0]?.last_update ?? null,
    };
  }

  async getLatestUpdateTime(): Promise<Date | null> {
    const result = await this.pool.query(
      `SELECT MAX(create_at) AS latest_update FROM copilot_seats_snapshot`,
    );
    return result.rows[0]?.latest_update ?? null;
  }

  async close() {
    await this.pool.end();
  }
}

export default CopilotSeatsDbService;
