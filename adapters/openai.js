// adapters/openai.js - called from relay/index.html when auto-mode is on
// This file is included in the frontend. It POSTs to /.netlify/functions/route

export async function callCouncilNode(envelope) {
  const res = await fetch('/.netlify/functions/route', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ envelope })
  });
  if(!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.envelope; // canonical envelope back
}
