import { context, reddit } from '@devvit/web/server';
import { Hono } from 'hono';

const MAX_TITLE_LENGTH = 300;
const MAX_BODY_LENGTH = 40_000;

type CreatePostRequest = {
  title?: unknown;
  body?: unknown;
};

type CreatePostResponse =
  | { ok: true; postId: string; permalink: string; subreddit: string }
  | { ok: false; error: string };

function readPostRequest(input: CreatePostRequest):
  | { ok: true; title: string; body: string }
  | { ok: false; error: string } {
  if (typeof input.title !== 'string') {
    return { ok: false, error: 'title must be a string.' };
  }
  if (typeof input.body !== 'string') {
    return { ok: false, error: 'body must be a string.' };
  }

  const title = input.title.trim();
  const body = input.body.trim();

  if (!title) return { ok: false, error: 'title cannot be empty.' };
  if (title.length > MAX_TITLE_LENGTH) {
    return { ok: false, error: `title must be ${MAX_TITLE_LENGTH} characters or fewer.` };
  }
  if (body.length > MAX_BODY_LENGTH) {
    return { ok: false, error: `body must be ${MAX_BODY_LENGTH} characters or fewer.` };
  }

  return { ok: true, title, body };
}

export const externalPostRoutes = new Hono();

externalPostRoutes.post('/post', async (c) => {
  let input: CreatePostRequest;
  try {
    input = await c.req.json<CreatePostRequest>();
  } catch {
    return c.json<CreatePostResponse>(
      { ok: false, error: 'Request body must be valid JSON.' },
      400
    );
  }

  const postRequest = readPostRequest(input);
  if (!postRequest.ok) return c.json<CreatePostResponse>(postRequest, 400);

  // The external endpoint URL identifies the installation. Do not accept a
  // subreddit name from n8n, which would allow a caller to choose a target.
  const subredditName = context.subredditName;
  if (!subredditName) {
    return c.json<CreatePostResponse>(
      { ok: false, error: 'This endpoint must be called through an installed subreddit.' },
      400
    );
  }

  try {
    // No runAs option: managed-token endpoint calls post as the Devvit app account.
    const post = await reddit.submitPost({
      subredditName,
      title: postRequest.title,
      text: postRequest.body,
    });

    return c.json<CreatePostResponse>(
      {
        ok: true,
        postId: post.id,
        permalink: post.permalink,
        subreddit: subredditName,
      },
      201
    );
  } catch (error) {
    console.error('Unable to create external post', error);
    return c.json<CreatePostResponse>(
      { ok: false, error: 'Reddit rejected the post. Check installation and app permissions.' },
      502
    );
  }
});
