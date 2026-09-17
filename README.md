# ai-bangladesh-agent external poster

This is a minimal Devvit app for this flow:

```text
n8n -> managed Devvit app token -> POST /external/post -> Reddit post
```

The post is submitted as the `ai-bangladesh-agent` app account to the subreddit installation identified by the endpoint URL. The handler deliberately does not accept a subreddit name in the request body.

## Request body

```json
{
  "title": "AI news from Bangladesh",
  "body": "The Markdown text for the Reddit self-post."
}
```

`title` is required (up to 300 characters). `body` is required and may be empty after trimming (up to 40,000 characters).

## Setup

1. Replace `dev.subreddit` in `devvit.json` with your test subreddit.
2. Install dependencies with `npm ci`, then run `npm run test`.
3. Playtest/upload the app and install it in `r/AI_Bangladesh`.
4. Request and receive access to Devvit External Endpoints, then create a managed App Token in Developer Settings.
5. In n8n, configure an HTTP Request node:
   - Method: `POST`
   - URL: `https://<app-slug>-<subreddit-id>-external.devvit.net/external/post`
   - Header: `Authorization: Bearer devvit_at_<managed-token-secret>`
   - Header: `Content-Type: application/json`
   - Body: JSON object matching the example above.

Store the token only in n8n credentials or another secret manager. It is shown once and must never be placed in this project or an n8n workflow export.

## Limits and behavior

- External Endpoints access is limited and requires Reddit approval.
- Managed tokens are global across an app's installations; only install this app where you intend it to post.
- n8n must treat an HTTP `201` response as success. Do not blindly retry after a timeout: this first minimal version has no idempotency store, so a retry could create a duplicate post.
