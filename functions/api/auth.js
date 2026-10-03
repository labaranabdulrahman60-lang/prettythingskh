export async function onRequest(context) {
  const { env } = context;

  const clientId = env.GITHUB_CLIENT_ID;
  const redirectUri = 'https://prettythingskhairat.com/api/callback';

  if (!clientId) {
    return new Response('Missing GITHUB_CLIENT_ID', { status: 500 });
  }

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user`;

  return Response.redirect(githubAuthUrl, 302);
}
