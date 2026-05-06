import { unknownResponseError } from "@/features/common/response-error";
import { ServerActionResponse } from "@/features/common/server-action-response";

export interface SeatSnapshotRow {
  username: string;
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

interface RawSeatRecord {
  assignee: { login: string };
  assigning_team?: { name?: string } | null;
  organization?: { login?: string } | null;
  plan_type?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_activity_at?: string | null;
  last_activity_editor?: string | null;
  pending_cancellation_date?: string | null;
}

export interface SeatsDBResult {
  seats: SeatSnapshotRow[];
  total_seats: number;
  total_active_seats: number;
  /** The actual snapshot_date row that was used (may differ from requested date). */
  snapshot_date: string | null;
  /** When this specific snapshot was captured by the cron job (create_at of the used snapshot_date). */
  snapshot_time: Date | null;
  /** Global: when the most recent snapshot of any date was inserted into the DB. */
  last_update_time: Date | null;
}

export async function getSeatsFromDB(date: string): Promise<ServerActionResponse<SeatsDBResult>> {
  try {
    const CopilotSeatsDbService = (await import('./copilot-seats-db-service')).default;
    const db = new CopilotSeatsDbService();
    const result = await db.getByDate(date);
    return { status: 'OK', response: result };
  } catch (e) {
    return unknownResponseError(e);
  }
}

export async function fetchAllSeatsRaw(
  token: string,
  version: string,
  enterprise: string,
  organization: string,
): Promise<RawSeatRecord[]> {
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': version,
  };

  const isEnterprise = process.env.GITHUB_API_SCOPE === 'enterprise' && enterprise;
  const baseUrl = isEnterprise
    ? `https://api.github.com/enterprises/${enterprise}/copilot/billing/seats?per_page=100`
    : `https://api.github.com/orgs/${organization}/copilot/billing/seats?per_page=100`;

  const allSeats: RawSeatRecord[] = [];
  let url: string | null = baseUrl;

  while (url) {
    const response = await fetch(url, { headers, cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Seats API error ${response.status}: ${await response.text()}`);
    }
    const data = await response.json();
    if (Array.isArray(data.seats)) {
      allSeats.push(...data.seats);
    }

    const linkHeader = response.headers.get('Link');
    url = extractNextUrl(linkHeader);
  }

  return allSeats;
}

function extractNextUrl(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  for (const link of linkHeader.split(',')) {
    const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match && match[2] === 'next') return match[1];
  }
  return null;
}
