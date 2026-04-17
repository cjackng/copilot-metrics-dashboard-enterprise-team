# GitHub Copilot Metrics - Dashboard

- [GitHub Copilot Metrics - Dashboard](#github-copilot-metrics---dashboard)
- [Introduction](#introduction)
- [Getting Started Locally](#getting-started-locally)
  - [Environment Variables](#environment-variables)
  - [Install \& Run](#install--run)
- [Dashboard](#dashboard)
  - [Features](#features)
- [Seats](#seats)
- [Premium Requests](#premium-requests)
  - [Database Setup](#database-setup)
  - [Automatic Data Sync](#automatic-data-sync)
  - [Manual Sync Trigger](#manual-sync-trigger)
- [Feature Flags](#feature-flags)
- [Docker](#docker)

# Introduction

The GitHub Copilot Metrics Dashboard is a solution accelerator designed to visualize metrics and premium request usage from GitHub Copilot using the [GitHub Copilot Usage Metrics API](https://docs.github.com/en/enterprise-cloud@latest/rest/copilot/copilot-usage-metrics?apiVersion=2026-03-10), [GitHub Copilot User Management API](https://docs.github.com/en/enterprise-cloud@latest/rest/copilot/copilot-user-management?apiVersion=2026-03-10) and [Github Copilot Usage Report API](https://docs.github.com/en/enterprise-cloud@latest/rest/billing/usage-reports?apiVersion=2026-03-10). For a detailed breakdown of every GitHub API endpoint used by this project, see [API_USAGES.md](API_USAGES.md).

# Getting Started Locally

To run the dashboard on your local machine, head to the **dashboard** folder under **src**:
```
📦copilot-metrics-dashboard
 ┣ 📂docs
 ┣ 📂src
 ┃ ┣  📂dashboard
 ┃ ┗ ...
 ┗ ...

```

## Environment Variables

You will be required to enter the following information in an **.env** file:

```
- GitHub Enterprise Name
- GitHub Token
- GitHub API Version (keep as default)
- GitHub API Scope (keep as default)
```

You can use the **.env.example** file as a reference.

For the **Premium Requests** feature, additional database environment variables are required (see [Database Setup](#database-setup)).

## Install & Run

Open the terminal while in the **dashboard** directory and do the following:

First, install packages using:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```
Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

# Dashboard

![GitHub Copilot Metrics - Dashboard](/docs/dashboard_2025.png "GitHub Copilot Metrics - Dashboard")

## Features

The dashboard showcases a range of features:

**Filters:** Ability to filter metrics by teams and date range (Last 7/14/28 days) and visualise data by time frame (daily, weekly).

**Weekend Filter:** Toggle to hide or show weekend data points in all charts, making it easier to focus on working-day trends.

**Acceptance Average:** Percentage of suggestions accepted by users for given date range and group by time range (daily, weekly, monthly).

**Active Users:** Number of active users for the last cycle.

**Adoption Rate:** Number of active users who are using GitHub Copilot in relation to the total number of licensed users.

**Seat Information:** Number of active, inactive, and total users.

**Chat Metrics:** Charts for active users and acceptance rates, providing visibility into Copilot Chat engagement alongside code completion metrics.

# Seats

Seats feature shows the list of users having a Copilot licence assigned.
This feature can be enabled or disabled by setting the `ENABLE_SEATS_FEATURE` environment variable to `true` or `false` respectively (default value is `true`).

> Assigned seats ingestion is enabled by default. It is possible to disable it by setting the `ENABLE_SEATS_INGESTION` environment variable to `false`.

# Premium Requests

The **Premium Requests** page (`/premium-requests`) provides visibility into GitHub Copilot premium model usage across your enterprise. It displays a sortable, filterable table of per-user premium request consumption including:

- **Username / User ID** – Copilot user identity.
- **Total Requests** – Aggregated premium request count for the selected date range.
- **Request Quota** – Monthly quota allocated to the user (`N/A` if picking cross month filter).
- **Team** – GitHub team memberships, populated from enterprise member data.

The table supports **team filtering**, **column sorting**, and **CSV export**. A date / month picker lets you navigate historical data. The header shows the **last sync time** so you always know how fresh the data is.

This feature can be enabled or disabled by setting the `ENABLE_PREMIUM_REQUESTS_FEATURE` environment variable to `true` or `false` (default: `true`).

## Database Setup

Premium request usage data is persisted in a **PostgreSQL** database. Add the following variables to your **.env** file:

```env
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USERNAME=your-database-username
DB_PASSWORD=your-database-password
```

The table (`premium_usage_report`) is created automatically on first run. You can also create it manually using the provided SQL script:

```bash
psql -h <host> -U <user> -d <database> -f src/dashboard/create_premium_usage_table.sql
```

## Automatic Data Sync

When running in **production** (`NODE_ENV=production`), a background cron job automatically syncs premium request usage data from the GitHub Enterprise Billing Reports API twice daily at **05:00 and 13:00 UTC** (`0 5,13 * * *`).

The sync process:
1. Requests a `premium_request` billing report from GitHub for the period since the last sync.
2. Waits for the report to be generated, then downloads the CSV.
3. Enriches each record with display names and team memberships from the enterprise members API.
4. Upserts the enriched records into the PostgreSQL database.

For full details on scheduling, retry behavior, and runtime requirements, see [SCHEDULE_JOB.md](SCHEDULE_JOB.md).

## Manual Sync Trigger

You can trigger an immediate sync without waiting for the scheduled run:

```
GET /api/cron/premium-usage?action=run-now
```

For more details, see [SCHEDULE_JOB.md](SCHEDULE_JOB.md).

# Feature Flags

All three main sections of the application can be toggled independently via environment variables:

| Environment Variable             | Default | Description                            |
|----------------------------------|---------|----------------------------------------|
| `ENABLE_DASHBOARD_FEATURE`       | `true`  | Show / hide the main metrics dashboard |
| `ENABLE_PREMIUM_REQUESTS_FEATURE`| `true`  | Show / hide the Premium Requests page  |
| `ENABLE_SEATS_FEATURE`           | `true`  | Show / hide the Seats page             |

Set any variable to `false` to disable the corresponding feature and remove it from the navigation.

# Docker

A `Dockerfile` is included at the repository root for containerised deployments.

```bash
# Build the image
docker build -t copilot-metrics-dashboard .

# Run the container
docker run -p 3000:3000 \
  -e GITHUB_ENTERPRISE=your-enterprise \
  -e GITHUB_TOKEN=your-token \
  -e GITHUB_API_VERSION=2022-11-28 \
  -e GITHUB_API_SCOPE=enterprise \
  -e DB_HOST=your-db-host \
  -e DB_PORT=5432 \
  -e DB_NAME=your-db-name \
  -e DB_USERNAME=your-db-user \
  -e DB_PASSWORD=your-db-password \
  copilot-metrics-dashboard
```