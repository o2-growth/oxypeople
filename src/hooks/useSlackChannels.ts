import { useQuery } from "@tanstack/react-query";

interface SlackChannel {
  id: string;
  name: string;
  is_member: boolean;
}

export function useSlackChannels() {
  return useQuery({
    queryKey: ["slack-channels"],
    queryFn: async (): Promise<SlackChannel[]> => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-slack-message?action=list-channels`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Slack channels");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch channels");
      }

      return result.channels || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1,
    enabled: true,
  });
}

export async function sendSlackMessage(
  channelId: string,
  message: string,
  authorName: string,
  images?: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-slack-message`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel_id: channelId,
          message,
          author_name: authorName,
          images,
        }),
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error sending Slack message:", error);
    return { success: false, error: "Failed to send message" };
  }
}
