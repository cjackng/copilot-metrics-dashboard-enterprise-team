import PostgresDBService from '@/services/postgres-db-service';
import { EnterpriseTeam } from '@/features/common/models';
import { PoolClient } from 'pg';

class EnterpriseTeamService {
  private dbService: PostgresDBService;
  constructor(dbService: PostgresDBService) {
    this.dbService = dbService;
  }

  async getEnterpriseTeams(): Promise<EnterpriseTeam[]> {
    const stmt = `
      SELECT
        team_id AS id,
        name,
        slug,
        description,
        group_id,
        organization_selection_type
      FROM enterprise_teams
      WHERE is_deleted = FALSE
    `;

    const result = await this.dbService.getPool().query(stmt);
    return result.rows as EnterpriseTeam[];
  }

  async upsertEnterpriseTeamsBatch(rows: EnterpriseTeam[]) {
    if (rows.length === 0) return;

    const client = await this.dbService.getPool().connect();
    try {
      await client.query('BEGIN');
      console.log(`[Enterprise Team Service] Starting enterprise teams upsert for ${rows.length} records`);

      const batchSize = 1000;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        console.log(`[Enterprise Team Service] Processing enterprise teams batch ${i + 1} - ${i + batch.length}`);
        await this.processEnterpriseTeamsBatch(client, batch);
      }

      await this.markMissingTeamsAsDeleted(client, rows);

      console.log(`[Enterprise Team Service] Enterprise teams upsert completed for ${rows.length} records`);
      await client.query('COMMIT');
    } catch (error) {
      console.error('[Enterprise Team Service] Error during enterprise teams upsert, rolling back transaction', error);
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async processEnterpriseTeamsBatch(client: PoolClient, batch: EnterpriseTeam[]) {
    const values = batch.map((row) => [
      row.id,
      row.name,
      row.slug,
      row.description,
      row.created_at,
      row.updated_at,
      row.group_id,
      row.organization_selection_type,
      false,
    ]);

    const upsertStmt = this.dbService.formatStatement(`
      INSERT INTO enterprise_teams (
        team_id, name, slug, description, created_at_github, updated_at_github,
        group_id, organization_selection_type, is_deleted
      ) VALUES %L
      ON CONFLICT (team_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        created_at_github = EXCLUDED.created_at_github,
        updated_at_github = EXCLUDED.updated_at_github,
        group_id = EXCLUDED.group_id,
        organization_selection_type = EXCLUDED.organization_selection_type,
        is_deleted = FALSE,
        updated_at = NOW()
    `, values);

    await client.query(upsertStmt);
  }

  private async markMissingTeamsAsDeleted(client: PoolClient, rows: EnterpriseTeam[]) {
    const currentTeamIds = rows
      .map((row) => row.id)
      .filter((id): id is number => typeof id === 'number');

    if (currentTeamIds.length === 0) return;

    const markDeletedStmt = `
      UPDATE enterprise_teams
      SET
        is_deleted = TRUE,
        updated_at = NOW()
      WHERE team_id <> ALL($1::BIGINT[])
    `;

    const result = await client.query(markDeletedStmt, [currentTeamIds]);
    if (result.rowCount && result.rowCount > 0) {
      console.log(`[Enterprise Team Service] Marked ${result.rowCount} missing team(s) as deleted`);
    }
  }
}

export default EnterpriseTeamService;