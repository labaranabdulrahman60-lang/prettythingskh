export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  // 1. If there is no code, we are starting the login. Send user to GitHub.
  if (!code) {
    const clientId = env.GITHUB_CLIENT_ID;
    const redirectUri = 'https://prettythingskhairat.com/api/auth'; // Notice this now points to itself!

    if (!clientId) {
      return new Response('Missing GITHUB_CLIENT_ID', { status: 500 });
    }

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user`;
    return Response.redirect(githubAuthUrl, 302);
  }

  // 2. If there IS a code, GitHub sent the user back. Exchange it for a token.
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response('Missing GitHub credentials', { status: 500 });
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: 'https://prettythingskhairat.com/api/auth' // Must match the one above!
    })
  });

  const tokenData = await tokenResponse.json();
  const token = tokenData.access_token;

  if (!token) {
    return new Response('Failed to get access token', { status: 400 });
  }

  // 3. Send the token back to Decap CMS
  const html = `
    <!doctype html>
    <html>
      <head><title>Authorizing...</title></head>
      <body>
        <script>
          (function() {
            function receiveMessage(e) {
              window.opener.postMessage(
                'authorization:github:success:${JSON.stringify({ token: token, provider: 'github' })}',
                e.origin
              );
              window.removeEventListener('message', receiveMessage, false);
            }
            window.addEventListener('message', receiveMessage, false);
            window.opener.postMessage('authorizing:github', '*');
          })();
        </script>
      </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}
