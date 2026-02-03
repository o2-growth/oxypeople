export async function sendSlackMessage(
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
          channel_name: "general",
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
