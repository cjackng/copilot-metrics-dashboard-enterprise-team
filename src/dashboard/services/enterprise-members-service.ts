/**
 * get_enterprise_members.ts
 * Fetches all members of a GitHub Enterprise (via GraphQL) and their enterprise
 * team memberships (via REST API), then outputs a combined report.
 *
 */

import process from "node:process";
import { ensureGitHubEnvConfig } from "./env-service";


const QUERY = `
query($enterprise: String!, $after: String) {
  enterprise(slug: $enterprise) {
    members(first: 100, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on User {
          databaseId
          login
          name
        }
        ... on EnterpriseUserAccount {
          login
          name
          user {
            databaseId
          }
        }
      }
    }
  }
}
`;


type GraphQLError = {
  message: string;
};

type GraphQLMemberNode = {
  databaseId?: number | null;
  login?: string | null;
  name?: string | null;
  user?: {
    databaseId?: number | null;
  } | null;
};

type GraphQLMembersResponse = {
  data?: {
    enterprise?: {
      members?: {
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
        nodes: GraphQLMemberNode[];
      };
    };
  };
  errors?: GraphQLError[];
};

export type Member = {
  id: number | null;
  login: string;
  display_name: string;
  teams: string[];
};

type Team = {
  id: number;
  name: string;
  slug: string;
};

type TeamMembershipUser = {
  login: string;
};


function restHeaders(token: string, version: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": version,
    "Content-Type": "application/json",
  };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(url, init);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status} ${resp.statusText} - ${text}`);
  }
  return (await resp.json()) as T;
}

async function fetchMembers(enterprise: string, token: string): Promise<Member[]> {
  console.log(`Fetching members for enterprise: ${enterprise} ...`);

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  let after: string | null = null;
  const allMembers: Member[] = [];

  while (true) {
    const graphqlResponse: GraphQLMembersResponse = await fetchJson<GraphQLMembersResponse>("https://api.github.com/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: QUERY,
        variables: { enterprise, after },
      }),
    });

    if (graphqlResponse.errors?.length) {
      for (const err of graphqlResponse.errors) {
        console.error(`[ERROR] ${err.message}`);
      }
      throw new Error("GraphQL query failed with errors.");
    }

    const enterpriseMembers = graphqlResponse.data?.enterprise?.members;
    if (!enterpriseMembers) {
      throw new Error("Unexpected GraphQL response: missing data.enterprise.members");
    }

    for (const user of enterpriseMembers.nodes) {
      const dbId = user.databaseId ?? user.user?.databaseId ?? null;
      allMembers.push({
        id: dbId,
        login: user.login ?? "",
        display_name: user.name ?? "",
        teams: [],
      });
    }

    if (enterpriseMembers.pageInfo.hasNextPage) {
      after = enterpriseMembers.pageInfo.endCursor;
    } else {
      break;
    }
  }

  return allMembers;
}

async function fetchEnterpriseTeams(enterprise: string, token: string, version: string): Promise<Team[]> {
  const teams: Team[] = [];
  let page = 1;

  while (true) {
    const url = new URL(`https://api.github.com/enterprises/${enterprise}/teams`);
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));

    const batch = await fetchJson<Team[]>(url.toString(), {
      headers: restHeaders(token, version),
    });

    if (!batch.length) break;

    for (const t of batch) {
      teams.push({ id: t.id, name: t.name, slug: t.slug });
    }

    if (batch.length < 100) break;
    page += 1;
  }

  return teams;
}

async function fetchTeamMembers(
  enterprise: string,
  token: string,
  version: string,
  teamSlug: string,
): Promise<string[]> {
  const logins: string[] = [];
  let page = 1;

  while (true) {
    const url = new URL(`https://api.github.com/enterprises/${enterprise}/teams/${teamSlug}/memberships`);
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));

    const batch = await fetchJson<TeamMembershipUser[]>(url.toString(), {
      headers: restHeaders(token, version),
    });

    if (!batch.length) break;

    for (const u of batch) {
      if (u?.login) logins.push(u.login);
    }

    if (batch.length < 100) break;
    page += 1;
  }

  return logins;
}

export async function buildMemberTeamsMap(enterprise: string, token: string, version: string): Promise<Map<string, string[]>> {
  
  console.log("  Fetching enterprise teams ...");
  const teams = await fetchEnterpriseTeams(enterprise, token, version);
  console.log(`  Found ${teams.length} team(s). Fetching memberships ...`);

  const memberTeams = new Map<string, string[]>();

  for (const team of teams) {
    const logins = await fetchTeamMembers(enterprise, token, version, team.slug);
    for (const login of logins) {
      const existing = memberTeams.get(login) ?? [];
      existing.push(team.name);
      memberTeams.set(login, existing);
    }
  }

  return memberTeams;
}

function printTable(members: Member[]): void {
  if (!members.length) {
    console.log("No members found.");
    return;
  }

  const colId = Math.max("ID".length, ...members.map((m) => String(m.id ?? "").length));
  const colLogin = Math.max("Login".length, ...members.map((m) => m.login.length));
  const colName = Math.max("Display Name".length, ...members.map((m) => m.display_name.length));
  const colTeams = Math.max("Teams".length, ...members.map((m) => m.teams.length));

  const header =
    `${"ID".padEnd(colId)}  ` +
    `${"Login".padEnd(colLogin)}  ` +
    `${"Display Name".padEnd(colName)}  ` +
    `${"Teams".padEnd(colTeams)}`;

  const divider = "-".repeat(header.length);

  console.log(divider);
  console.log(header);
  console.log(divider);

  for (const m of members) {
    console.log(
      `${String(m.id ?? "").padEnd(colId)}  ` +
        `${m.login.padEnd(colLogin)}  ` +
        `${m.display_name.padEnd(colName)}  ` +
        `${m.teams.join(" | ").padEnd(colTeams)}`
    );
  }

  console.log(divider);
  console.log(`Total: ${members.length} member(s)`);
}

function mapMembersLookup(members: Member[], memberTeams: Map<string, string[]>): Map<string, Member> {
  const lookup = new Map<string, Member>();
  for (const m of members) {
    const teams = memberTeams.get(m.login) ?? [];
    lookup.set(m.login, { ...m, teams });
  }
  return lookup;
}

export async function getAllEnterpriseMembersLookup(): Promise<Map<string, Member>> {
  const env = ensureGitHubEnvConfig();
  if (env.status !== 'OK') {
    throw new Error("Invalid GitHub environment configuration.", { cause: env.errors[0] });
  }
  
  const { token, version, enterprise } = env.response;
  const members = await fetchMembers(enterprise, token);
  const memberTeams = await buildMemberTeamsMap(enterprise, token, version);

  return mapMembersLookup(members, memberTeams);
}
