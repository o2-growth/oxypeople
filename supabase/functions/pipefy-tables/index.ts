import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getPipefyToken(): Promise<string> {
  const clientId = Deno.env.get('PIPEFY_CLIENT_ID');
  const clientSecret = Deno.env.get('PIPEFY_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Pipefy credentials not configured');
  }

  const response = await fetch('https://app.pipefy.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Pipefy token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchPipefyTables(token: string, organizationId?: string) {
  // First get the current user's organizations if no org ID provided
  const meQuery = `
    query {
      me {
        id
        name
        organizations {
          id
          name
        }
      }
    }
  `;

  const meResponse = await fetch('https://api.pipefy.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: meQuery }),
  });

  const meData = await meResponse.json();
  
  if (meData.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(meData.errors)}`);
  }

  const organizations = meData.data?.me?.organizations || [];
  
  // If no org ID provided, use the first organization
  const orgId = organizationId || organizations[0]?.id;
  
  if (!orgId) {
    return { organizations: [], tables: [] };
  }

  // Fetch tables from the organization
  const tablesQuery = `
    query($orgId: ID!) {
      organization(id: $orgId) {
        id
        name
        tables {
          edges {
            node {
              id
              name
              description
              table_fields {
                id
                label
                type
                required
              }
            }
          }
        }
      }
    }
  `;

  const tablesResponse = await fetch('https://api.pipefy.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      query: tablesQuery,
      variables: { orgId }
    }),
  });

  const tablesData = await tablesResponse.json();
  
  if (tablesData.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(tablesData.errors)}`);
  }

  const tables = tablesData.data?.organization?.tables?.edges?.map((edge: any) => edge.node) || [];

  return {
    organizations,
    currentOrganization: tablesData.data?.organization,
    tables,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId } = await req.json().catch(() => ({}));
    
    const token = await getPipefyToken();
    const result = await fetchPipefyTables(token, organizationId);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
