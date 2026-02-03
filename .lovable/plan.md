

## Plan: Add Slack Send Option to Feed Posts

### Overview
Add a Slack channel selector next to the emoji picker in the post creation form. When enabled, posts will be published to both the feed AND the selected Slack channel simultaneously.

### Step 1: Connect Slack to the Project
Before implementing the feature, we need to establish a Slack connection:
- This will provide the `SLACK_API_KEY` required for the integration
- You'll be prompted to authorize the Slack workspace
- **This is a prerequisite - the feature won't work without it**

### Step 2: Create Edge Function `send-slack-message`
**File:** `supabase/functions/send-slack-message/index.ts`

The function will support two operations:
- **GET** `?action=list-channels` - Returns available public Slack channels
- **POST** - Sends a message to the specified channel

Uses the Lovable gateway (`https://gateway.lovable.dev/slack/api/`) with proper authentication headers.

### Step 3: Create Slack Channels Hook
**File:** `src/hooks/useSlackChannels.ts`

- Fetches available Slack channels via the edge function
- Caches results using React Query (5-minute stale time)
- Handles loading and error states

### Step 4: Create Slack Channel Selector Component
**File:** `src/components/feed/SlackChannelSelector.tsx`

A popover component containing:
- Toggle switch to enable/disable Slack posting
- Channel dropdown to select destination
- Slack icon that changes appearance when active

### Step 5: Update CreatePost Component
**File:** `src/components/feed/CreatePost.tsx`

- Add state for `slackEnabled` and `slackChannelId`
- Place SlackChannelSelector between EmojiPicker and Publish button
- Modify submit handler to send to Slack when enabled

### Step 6: Update usePosts Hook
**File:** `src/hooks/usePosts.ts`

- Add optional `slackChannelId` parameter to `useCreatePost`
- Call the edge function after successful post creation if Slack is configured

### Visual Layout

```text
+------------------------------------------------------------------+
|  [Avatar]  What would you like to share?                         |
|            +--------------------------------------------------+  |
|            |                                                  |  |
|            +--------------------------------------------------+  |
|                                                                  |
|  [Image] [Emoji] [Slack]                          [Publish]      |
+------------------------------------------------------------------+

When clicking [Slack]:
+---------------------------+
| [ ] Send to Slack         |
| +-----------------------+ |
| | #general            v | |
| +-----------------------+ |
+---------------------------+
```

### Technical Details

**Edge Function API:**
- `GET ?action=list-channels` returns `{ channels: [{ id, name }] }`
- `POST` with body `{ channel_id, message, author_name, images? }` sends message

**Component Props:**
```text
SlackChannelSelector:
  - enabled: boolean
  - channelId: string | null
  - onEnabledChange: (enabled: boolean) => void
  - onChannelChange: (channelId: string) => void
  - disabled?: boolean
```

### Important Prerequisite
To start implementation, I'll first need to connect the Slack integration to your project. This will display a prompt where you can authorize your Slack workspace.

### Expected Results
- Slack icon button next to emoji picker
- Popover with toggle and channel selector
- Posts can be sent to both feed and Slack simultaneously
- Message in Slack includes author name, content, and images (if any)
- Success/error feedback for both destinations

