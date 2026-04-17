# Premium Requests Scheduled Job

This document describes the scheduled job for Premium Requests usage ingestion in `./src/dashboard/`.

## Introduction

The dashboard includes a built-in scheduled job to sync Premium Requests usage data from the GitHub Enterprise Billing Reports API into a PostgreSQL database. The Premium Requests page then reads from the database rather than calling GitHub APIs directly at request time.

## Schedule

- Cron expression: `0 5,13 * * *`
- Runs at **05:00 and 13:00 UTC** every day.

## Runtime Behavior

The scheduled job starts automatically via the [Next.js Instrumentation API](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation) (`instrumentation.ts`) when:

- `NEXT_RUNTIME` is `nodejs`
- `NODE_ENV` is `production`

The job will not start in development mode. It is also guarded against double-registration across hot-reloads using a global flag (`globalThis.__premiumUsageCronStarted`).

> **Feature flag:** The job is only meaningful when `ENABLE_PREMIUM_REQUESTS_FEATURE` is `true` (the default). Disabling the feature flag hides the UI but does not stop the cron job itself.

## Data Synchronization Flow

For each run, the job will:

1. Check the latest `update_at` timestamp in the `premium_usage_report` table to determine the start of the sync window (falls back to today if no data exists).
2. Request a `premium_request` billing report from the GitHub Enterprise Billing Reports API for the calculated date range.
3. Wait **30 seconds** for the report to be generated.
4. Poll the report status endpoint. If the report is not yet `completed`, retry up to **10 times** with a **60-second delay** between each attempt.
5. Download and parse the CSV from the report's download URL.
6. Enrich each record with enterprise member display name and team memberships (fetched in parallel from the GitHub GraphQL and REST APIs).
7. Insert or update (upsert) enriched records in PostgreSQL in batches of **1 000 rows**.

## Manual Trigger

You can trigger one immediate execution without waiting for the schedule:

- **Endpoint:** `GET /api/cron/premium-usage?action=run-now`
- **Method:** `GET`

The endpoint returns JSON with `status`, `message`, and `executedAt` fields.

## Notes

- All times are UTC. The cron expression uses the server's timezone; deploy with `TZ=UTC` to ensure consistent scheduling.
- If a sync run fails (e.g. report generation times out after 10 retries), the error is logged and the next scheduled run will retry from the last successful sync date.
- This job keeps Premium Requests dashboard data up to date with a maximum staleness of ~8 hours under normal conditions.
