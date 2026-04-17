# GitHub API Usage in src/dashboard

## Copilot Usage Metrics

The main Dashboard page fetches usage metrics directly from the GitHub Copilot Metrics Reports API at request time (no database involved).

- A 28-day rolling report is fetched on the initial page load.
- The API returns NDJSON download links; each link is downloaded and parsed client-side into the dashboard charts.

### Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/enterprises/{enterprise}/copilot/metrics/reports/users-28-day/latest` | Latest 28-day usage metrics report (download links) |
| `GET` | `/enterprises/{enterprise}/copilot/metrics/reports/users-1-day?day={YYYY-MM-DD}` | Single-day usage metrics report |

## Premium Requests

Premium Requests data is synchronized through a scheduled job and then served from PostgreSQL.

- The scheduled job requests a premium_request billing report from the GitHub Billing Reports API.
- It checks report status, downloads CSV data, enriches records with enterprise member and team data, and writes to PostgreSQL.
- The Premium Requests page reads data from PostgreSQL (not directly from GitHub API at request time).

### Enterprise Member Enrichment

During Premium Requests synchronization, the job enriches each usage record with enterprise member profile and team information.

- Member profile data is fetched using GitHub GraphQL enterprise members query.
- Enterprise teams are fetched using the enterprise teams REST API.
- Team memberships are fetched using the enterprise team memberships REST API.
- The member-to-team lookup is then used to enrich each Premium Requests record before writing to PostgreSQL.

## Seats

Seats data is fetched directly from the GitHub Copilot seats billing API at request time. The API scope is controlled by `GITHUB_API_SCOPE`:

- `enterprise` scope → enterprise seats endpoint (paginated, `per_page=100`).
- `organization` scope → organization seats endpoint (paginated, `per_page=100`).

Active seat count is computed client-side: a seat is considered active if its `last_activity_at` is within the last 30 days.

### Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/enterprises/{enterprise}/copilot/billing/seats?per_page=100` | Enterprise-scoped seat list (paginated) |
| `GET` | `/orgs/{organization}/copilot/billing/seats?per_page=100` | Org-scoped seat list (paginated) |

## Related GitHub API Endpoints (Summary)

### Copilot Usage Metrics
- `GET /enterprises/{enterprise}/copilot/metrics/reports/users-28-day/latest`
- `GET /enterprises/{enterprise}/copilot/metrics/reports/users-1-day?day={YYYY-MM-DD}`

### Copilot Seats Billing
- `GET /enterprises/{enterprise}/copilot/billing/seats`
- `GET /orgs/{organization}/copilot/billing/seats`

### Enterprise Billing Reports (Premium Requests)
- `POST /enterprises/{enterprise}/settings/billing/reports`
- `GET  /enterprises/{enterprise}/settings/billing/reports/{reportId}`

### Enterprise Members and Teams Enrichment
- `POST /graphql` — enterprise members query (paginated via cursor)
- `GET  /enterprises/{enterprise}/teams`
- `GET  /enterprises/{enterprise}/teams/{teamSlug}/memberships`
