import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

async function fetchTableRecords(token: string, tableId: string, cursor?: string) {
  const query = `
    query($tableId: ID!, $after: String) {
      table_records(table_id: $tableId, first: 50, after: $after) {
        edges {
          node {
            id
            title
            record_fields {
              name
              value
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const response = await fetch('https://api.pipefy.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      query,
      variables: { tableId, after: cursor }
    }),
  });

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
  }

  return data.data?.table_records;
}

function extractFieldValue(recordFields: any[], fieldName: string): string | null {
  const field = recordFields.find((f: any) => 
    f.name?.toLowerCase() === fieldName?.toLowerCase()
  );
  return field?.value || null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { companyId, tableId, fieldMapping } = await req.json();
    
    if (!companyId || !tableId || !fieldMapping) {
      throw new Error('Missing required parameters: companyId, tableId, fieldMapping');
    }

    // Create sync log
    const { data: logEntry, error: logError } = await supabase
      .from('pipefy_sync_logs')
      .insert({
        company_id: companyId,
        status: 'running',
      })
      .select()
      .single();

    if (logError) throw logError;

    const logId = logEntry.id;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;
    let recordsSynced = 0;

    try {
      const token = await getPipefyToken();
      
      let hasMore = true;
      let cursor: string | undefined;
      
      while (hasMore) {
        const result = await fetchTableRecords(token, tableId, cursor);
        const records = result?.edges || [];
        
        for (const edge of records) {
          const record = edge.node;
          const fields = record.record_fields;
          
          // Extract mapped fields
          const email = extractFieldValue(fields, fieldMapping.email);
          const fullName = extractFieldValue(fields, fieldMapping.full_name);
          const position = extractFieldValue(fields, fieldMapping.position);
          const departmentName = extractFieldValue(fields, fieldMapping.department);
          const teamName = extractFieldValue(fields, fieldMapping.team);
          const hireDateStr = extractFieldValue(fields, fieldMapping.hire_date);
          const birthDateStr = extractFieldValue(fields, fieldMapping.birth_date);
          const employmentType = extractFieldValue(fields, fieldMapping.employment_type);

          if (!email) {
            recordsSkipped++;
            continue;
          }

          recordsSynced++;

          // Check if user exists
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

          let userId: string;

          if (existingUser) {
            userId = existingUser.id;
            
            // Update user info
            await supabase
              .from('users')
              .update({
                full_name: fullName || undefined,
                birth_date: birthDateStr || undefined,
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);

            recordsUpdated++;
          } else {
            // Create user in auth (this would require admin API)
            // For now, we'll create a placeholder in public.users
            // The actual auth user will be created when they accept invite
            
            const newUserId = crypto.randomUUID();
            
            const { error: userError } = await supabase
              .from('users')
              .insert({
                id: newUserId,
                email: email.toLowerCase(),
                full_name: fullName || email.split('@')[0],
                birth_date: birthDateStr || null,
              });

            if (userError) {
              console.error('Error creating user:', userError);
              recordsSkipped++;
              continue;
            }

            userId = newUserId;
            recordsCreated++;
          }

          // Handle department
          let departmentId: string | null = null;
          if (departmentName) {
            const { data: dept } = await supabase
              .from('departments')
              .select('id')
              .eq('company_id', companyId)
              .eq('name', departmentName)
              .single();

            if (dept) {
              departmentId = dept.id;
            } else {
              // Create department
              const { data: newDept } = await supabase
                .from('departments')
                .insert({
                  company_id: companyId,
                  name: departmentName,
                })
                .select()
                .single();
              
              if (newDept) {
                departmentId = newDept.id;
              }
            }
          }

          // Check/create company membership
          const { data: existingMembership } = await supabase
            .from('company_memberships')
            .select('id')
            .eq('user_id', userId)
            .eq('company_id', companyId)
            .single();

          if (existingMembership) {
            // Update membership
            await supabase
              .from('company_memberships')
              .update({
                position: position || undefined,
                department_id: departmentId || undefined,
                department: departmentName || undefined,
                hire_date: hireDateStr || undefined,
                employment_type: employmentType || undefined,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingMembership.id);
          } else {
            // Create membership
            await supabase
              .from('company_memberships')
              .insert({
                user_id: userId,
                company_id: companyId,
                position: position || null,
                department_id: departmentId,
                department: departmentName,
                hire_date: hireDateStr || null,
                employment_type: employmentType || null,
                status: 'invited',
              });

            // Create user role
            await supabase
              .from('user_roles')
              .insert({
                user_id: userId,
                company_id: companyId,
                role: 'member',
              });
          }

          // Handle team if specified
          if (teamName) {
            const { data: team } = await supabase
              .from('teams')
              .select('id')
              .eq('company_id', companyId)
              .eq('name', teamName)
              .single();

            let teamId: string | null = null;

            if (team) {
              teamId = team.id;
            } else {
              // Create team
              const { data: newTeam } = await supabase
                .from('teams')
                .insert({
                  company_id: companyId,
                  name: teamName,
                  department_id: departmentId,
                })
                .select()
                .single();
              
              if (newTeam) {
                teamId = newTeam.id;
              }
            }

            if (teamId) {
              // Check if already member
              const { data: existingTeamMember } = await supabase
                .from('team_members')
                .select('id')
                .eq('user_id', userId)
                .eq('team_id', teamId)
                .single();

              if (!existingTeamMember) {
                await supabase
                  .from('team_members')
                  .insert({
                    user_id: userId,
                    team_id: teamId,
                    role: 'member',
                  });
              }
            }
          }
        }

        hasMore = result?.pageInfo?.hasNextPage || false;
        cursor = result?.pageInfo?.endCursor;
      }

      // Update sync config
      await supabase
        .from('pipefy_sync_config')
        .update({
          last_sync_at: new Date().toISOString(),
          sync_status: 'success',
        })
        .eq('company_id', companyId);

      // Complete log
      await supabase
        .from('pipefy_sync_logs')
        .update({
          status: 'success',
          completed_at: new Date().toISOString(),
          records_synced: recordsSynced,
          records_created: recordsCreated,
          records_updated: recordsUpdated,
          records_skipped: recordsSkipped,
        })
        .eq('id', logId);

      return new Response(JSON.stringify({
        success: true,
        recordsSynced,
        recordsCreated,
        recordsUpdated,
        recordsSkipped,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (syncError) {
      // Update log with error
      await supabase
        .from('pipefy_sync_logs')
        .update({
          status: 'error',
          completed_at: new Date().toISOString(),
          error_message: syncError.message,
        })
        .eq('id', logId);

      throw syncError;
    }

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
