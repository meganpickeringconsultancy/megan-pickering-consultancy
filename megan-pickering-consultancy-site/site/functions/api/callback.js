export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code
    })
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    const errorScript = `
      <script>
        window.opener.postMessage(
          'authorization:github:error:${JSON.stringify(tokenData)}',
          '*'
        );
      </script>`;
    return new Response(errorScript, { headers: { 'Content-Type': 'text/html' } });
  }

  const token = tokenData.access_token;
  const payload = JSON.stringify({ token, provider: 'github' });

  const successScript = `
    <script>
      (function() {
        function receiveMessage(e) {
          window.opener.postMessage(
            'authorization:github:success:${payload}',
            e.origin
          );
          window.removeEventListener('message', receiveMessage, false);
        }
        window.addEventListener('message', receiveMessage, false);
        window.opener.postMessage('authorizing:github', '*');
      })();
    </script>`;

  return new Response(successScript, { headers: { 'Content-Type': 'text/html' } });
}
