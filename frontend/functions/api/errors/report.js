export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { error, componentStack, url, timestamp, source } = body;
    console.error("[CODVEDA-AUTH] Client error report:", JSON.stringify({ error, componentStack, url, timestamp, source }));
    return new Response(JSON.stringify({ reported: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ reported: false }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequest(context) {
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}
