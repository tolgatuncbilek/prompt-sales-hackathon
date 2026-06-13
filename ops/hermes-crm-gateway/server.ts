const port = Number(process.env.PORT || 8787);
const token = process.env.CRM_GATEWAY_TOKEN;

if (!token) throw new Error("CRM_GATEWAY_TOKEN is required");

type ChatMessage = { role: string; content: string };

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

function authorized(request: Request): boolean {
  return request.headers.get("authorization") === `Bearer ${token}`;
}

function promptFrom(messages: ChatMessage[]): string {
  return messages
    .filter((message) => typeof message.content === "string")
    .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
    .join("\n\n");
}

async function runHermes(prompt: string): Promise<string> {
  const process = Bun.spawn(
    [
      "hermes",
      "--oneshot",
      prompt,
      "--provider",
      "deepseek",
      "--model",
      "deepseek/deepseek-chat",
      "--toolsets",
      "web",
    ],
    {
      cwd: "/home/hermes/crm-agent",
      env: { ...Bun.env, HOME: "/home/hermes" },
      stdout: "pipe",
      stderr: "pipe",
    },
  );

  const timeout = setTimeout(() => process.kill(), 180_000);
  const [output, errors, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ]);
  clearTimeout(timeout);

  if (exitCode !== 0) {
    console.error(errors.slice(-4000));
    throw new Error(`Hermes exited with code ${exitCode}`);
  }

  const trimmed = output.trim();
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}");
  return jsonStart >= 0 && jsonEnd > jsonStart
    ? trimmed.slice(jsonStart, jsonEnd + 1)
    : trimmed;
}

Bun.serve({
  hostname: "0.0.0.0",
  port,
  idleTimeout: 185,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({ status: "ok", service: "hermes-crm-gateway" });
    }

    if (url.pathname !== "/v1/chat/completions" || request.method !== "POST") {
      return json({ error: "Not found" }, 404);
    }

    if (!authorized(request)) return json({ error: "Unauthorized" }, 401);

    try {
      const body = await request.json() as { model?: string; messages?: ChatMessage[] };
      if (!Array.isArray(body.messages) || body.messages.length === 0) {
        return json({ error: "messages are required" }, 400);
      }

      const content = await runHermes(promptFrom(body.messages));
      return json({
        id: `hermes-${crypto.randomUUID()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: body.model || "hermes-crm",
        choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
      });
    } catch (error) {
      console.error(error);
      return json({ error: "Hermes request failed" }, 502);
    }
  },
});

console.log(`Hermes CRM gateway listening on ${port}`);
