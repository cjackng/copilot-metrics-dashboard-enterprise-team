import CopilotSeatsDbService, { SeatSnapshotInsertRow } from '@/services/copilot-seats-db-service';
import { ensureGitHubEnvConfig } from '@/services/env-service';
import { format } from 'date-fns';
import { getAllEnterpriseMembersLookupFresh } from '@/services/enterprise-members-service';
import { fetchAllSeatsRaw } from '@/services/copilot-seat-service';

function log(message: string) {
  console.log(`[CopilotSeats-Cron]: ${message}`);
}

export async function syncSeatsSnapshot() {
  try {
    log('Starting seats snapshot synchronization...');

    const env = ensureGitHubEnvConfig();
    if (env.status !== 'OK') {
      log(`Failed to get env config: ${env.errors[0].message}`);
      return;
    }
    const { token, version, enterprise, organization } = env.response;

    const db = new CopilotSeatsDbService();
    await db.init();

    const today = format(new Date(), 'yyyy-MM-dd');

    log('Fetching seats and members in parallel...');
    const [rawSeats, { memberMap }] = await Promise.all([
      fetchAllSeatsRaw(token, version, enterprise, organization),
      getAllEnterpriseMembersLookupFresh(),
    ]);

    const rows: SeatSnapshotInsertRow[] = rawSeats.map((seat) => ({
      snapshot_date: today,
      username: seat.assignee.login,
      display_username: memberMap.get(seat.assignee.login)?.display_name ?? null,
      organization: seat.organization?.login ?? null,
      team: seat.assigning_team?.name ?? null,
      plan_type: seat.plan_type ?? null,
      created_at: seat.created_at ?? null,
      updated_at: seat.updated_at ?? null,
      last_activity_at: seat.last_activity_at ?? null,
      last_activity_editor: seat.last_activity_editor ?? null,
      pending_cancellation_date: seat.pending_cancellation_date ?? null,
    }));

    log(`Upserting ${rows.length} seat records for ${today}...`);
    await db.upsertBatch(rows);
    log(`Seats snapshot sync completed: ${rows.length} records for ${today}`);
  } catch (error) {
    log(`Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}
