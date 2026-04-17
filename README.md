# GitHub Copilot Metrics - Dashboard

- [GitHub Copilot Metrics - Dashboard](#github-copilot-metrics---dashboard)
- [Introduction](#introduction)
  - [Dashboard](#dashboard)
    - [Features](#features)
    - [Getting Started Locally](#getting-started-locally)
      - [Environment Variables](#environment-variables)
      - [Install \& Run](#install--run)
  - [Seats](#seats)
- [Deploy to Azure](#deploy-to-azure)
      - [Prerequisites](#prerequisites)
- [Contributing](#contributing)
- [Trademarks](#trademarks)

# Introduction

The GitHub Copilot Metrics Dashboard is a solution accelerator designed to visualize metrics from GitHub Copilot using the [GitHub Copilot Metrics API](https://docs.github.com/en/enterprise-cloud@latest/rest/copilot/copilot-metrics?apiVersion=2022-11-28) and [GitHub Copilot User Management API](https://docs.github.com/en/enterprise-cloud@latest/rest/copilot/copilot-user-management?apiVersion=2022-11-28).

## Dashboard

![GitHub Copilot Metrics - Dashboard](/docs/dashboard_2025.png "GitHub Copilot Metrics - Dashboard")

### Features

The dashboard showcases a range of features:

**Filters:**
Ability to filter metrics by date range, languages, code editors, teams and visualise data by time frame (daily, weekly, monthly).

**Acceptance Average:** Percentage of suggestions accepted by users for given date range and group by time range (daily, weekly, monthly).

**Active Users:** Number of active users for the last cycle.

**Adoption Rate:** Number of active users who are using GitHub Copilot in relation to the total number of licensed users.

**Seat Information:** Number of active, inactive, and total users.

**Language:** Breakdown of languages which can be used to filter the data.

**Code Editors:** Breakdown of code editors which can be used to filter the data.

**Teams Filter:** Interactive filter available in the dashboard UI that allows you to analyze Copilot usage and adoption patterns by specific GitHub teams. This feature dynamically loads team data and provides team-level insights for more granular analysis of Copilot effectiveness across different organizational units.

### Getting Started Locally

To run the dashboard on your local machine, head to the **dashboard** folder under **src**:
```
📦copilot-metrics-dashboard
 ┣ 📂docs
 ┣ 📂src
 ┃ ┣  📂dashboard
 ┃ ┗ ...
 ┗ ...

```
#### Environment Variables

You will be required to enter the following information in an **.env** file:

```
- GitHub Enterprise name
- GitHub Organization name
- GitHub Token
- GitHub API Scope
```

You can use the **.env.example** file as a reference. GitHub API Scope defines the GITHUB_API_SCOPE environment variable and can be set to either "enterprise" or "organization". It is used to define at which level the GitHub APIs will gather data. If not specified, the default value is "organization".

#### Install & Run

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

## Seats

Seats feature shows the list of user having a Copilot licence assigned.
This feature is can be enabled or disabled by setting the `ENABLE_SEATS_FEATURE` environment variable to `true` or `false` respectively (default value is `true`).

> Assigned seats ingestion is enabled by default, is possbile to disable by setting the `ENABLE_SEATS_INGESTION` environment variable to `false`