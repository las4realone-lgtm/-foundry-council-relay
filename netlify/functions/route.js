// netlify/functions/route.js - one live connection: OpenAI
import OpenAI from "openai";

const NODES = {
  2: { name: "Veyra", role: "Builder / Executor" },
  3: { name: "Elara", role: "Context / Memory" },
  4: { name: "Loom", role: "Top-view / Verification" },
  5: { name: "Anvil", role: "Safety / Closure" }
};

export async function handler(event) {
  if(event.httpMethod !== 'POST') return {statusCode:405, body:'POST only'};
  const { envelope } = JSON.parse(event.body||'{}');
  if(!envelope?.REFERENCE?.claim_id) return {statusCode:400, body:'Missing REFERENCE.claim_id'};

  const target = envelope.ROUTING?.next;
  if(!target || target===1) {
    return {statusCode:200, body:JSON.stringify({envelope, done:true, message:"Return to Architect for closure/refuel"})};
  }

  const node = NODES[target];
  if(!node) return {statusCode:400, body:'Unknown target node'};

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const system = `You are ${node.name} - ${node.role} - Node ${target} in Foundry Council Relay v0.

PROTOCOL - you MUST return ONLY valid JSON envelope, no prose outside:

{
  "IDENTITY": {"sender": ${target}, "role_signature": "${node.name} - ${node.role}"},
  "REFERENCE": {"claim_id": "${envelope.REFERENCE.claim_id}", "claim_excerpt": "${envelope.REFERENCE.claim_excerpt.replace(/"/g,'\"')}"},
  "CONTENT": {"message": "YOUR ANSWER HERE (must reference claim exactly)", "claim_relation": "ANSWER | YIELD | CLARIFY_REFERENCE"},
  "ROUTING": {"next": null, "route_reason": "DEFAULT_ORDER | DIRECT_RELEVANCE_ZIGZAG | FUEL_EXHAUSTED_RETURN_TO_ARCHITECT | YIELD", "visit": ${ (envelope.ROUTING?.visit||0)+1 }},
  "CONTROL": {"fuel_remaining": ${envelope.CONTROL?.fuel_remaining||0}, "state": "ANSWERED | UNRESOLVED | YIELD"},
  "PROVENANCE": {"parent_message": "${envelope.message_id}"},
  "direct_reference": null
}

RULES:
- REFERENCE.claim_id and claim_excerpt must be copied EXACTLY, character for character
- PROVENANCE.parent_message must equal incoming message_id "${envelope.message_id}"
- If you need another node to answer specific point, set direct_reference to 2-5 and ROUTING.route_reason to DIRECT_RELEVANCE_ZIGZAG. This burns 1 fuel.
- If you have nothing new, set claim_relation YIELD
- Keep CONTENT.message concise, no giant transcript
`;

  const user = `Active claim: "${envelope.REFERENCE.claim_excerpt}"
Previous message from ${envelope.IDENTITY.sender}: ${envelope.CONTENT.message}
Fuel remaining: ${envelope.CONTROL.fuel_remaining}
History length: visit ${envelope.ROUTING.visit}

Respond as ${node.name}.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{role:"system", content: system}, {role:"user", content: user}],
    temperature: 0.3,
    response_format: {type:"json_object"}
  });

  let out;
  try { out = JSON.parse(completion.choices[0].message.content); }
  catch(e) { return {statusCode:500, body:'Model did not return JSON: '+completion.choices[0].message.content}; }

  // Validate minimal binding before returning
  if(out.REFERENCE?.claim_id !== envelope.REFERENCE.claim_id) {
    return {statusCode:400, body:JSON.stringify({error:"CLARIFY_REFERENCE claim_id mismatch", got:out})};
  }
  if(out.PROVENANCE?.parent_message !== envelope.message_id) {
    out.PROVENANCE.parent_message = envelope.message_id; // auto-fix
  }

  // Build canonical envelope wrapper
  const canonical = {
    message_id: 'msg_'+Math.random().toString(36).slice(2)+'_'+Date.now().toString(36),
    timestamp: new Date().toISOString(),
    canonical: true,
    ...out
  };

  return {statusCode:200, headers:{"Content-Type":"application/json"}, body:JSON.stringify({envelope: canonical})};
}
