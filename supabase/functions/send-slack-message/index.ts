import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SLACK_API_URL = 'https://slack.com/api';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SLACK_BOT_TOKEN = Deno.env.get('SLACK_BOT_TOKEN');
  if (!SLACK_BOT_TOKEN) {
    return new Response(
      JSON.stringify({ success: false, error: 'SLACK_BOT_TOKEN is not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // GET - List channels
    if (req.method === 'GET' && action === 'list-channels') {
      const response = await fetch(`${SLACK_API_URL}/conversations.list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      const channels = data.channels
        ?.filter((ch: { is_member: boolean; is_archived: boolean }) => !ch.is_archived)
        .map((ch: { id: string; name: string; is_member: boolean }) => ({
          id: ch.id,
          name: ch.name,
          is_member: ch.is_member,
        })) || [];

      return new Response(
        JSON.stringify({ success: true, channels }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Send message
    if (req.method === 'POST') {
      const { channel_id, message, author_name, images } = await req.json();

      if (!channel_id || !message) {
        return new Response(
          JSON.stringify({ success: false, error: 'channel_id and message are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Build message blocks for rich formatting
      const blocks: Array<{
        type: string;
        text?: { type: string; text: string };
        image_url?: string;
        alt_text?: string;
      }> = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `📢 *Novo post de ${author_name || 'Usuário'}*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${message}`,
          },
        },
      ];

      // Add images if provided
      if (images && images.length > 0) {
        images.forEach((imageUrl: string, index: number) => {
          blocks.push({
            type: "image",
            image_url: imageUrl,
            alt_text: `Imagem ${index + 1}`,
          });
        });
      }

      const response = await fetch(`${SLACK_API_URL}/chat.postMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: channel_id,
          blocks,
          text: `📢 Novo post de ${author_name || 'Usuário'}: ${message}`,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      return new Response(
        JSON.stringify({ success: true, message_ts: data.ts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in send-slack-message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
