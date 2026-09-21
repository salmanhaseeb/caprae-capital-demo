// Test-only OpenAI HTTP fixture. Production application has no mock mode.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { responseFixture } from "./analysis-fixture";
const server = createServer(async (req, res) => {
  let body = "";
  for await (const chunk of req) body += chunk;
  res.setHeader("Content-Type", "application/json");
  if (body.includes("AI_FAILURE_TEST")) {
    res.writeHead(503);
    res.end(JSON.stringify({ error: { message: "Fixture unavailable", type: "server_error" } }));
  } else res.end(JSON.stringify(responseFixture()));
});
server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No fixture port");
  const child = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3001"], {
    stdio: "inherit",
    env: { ...process.env, OPENAI_API_KEY: "test-fixture-key", OPENAI_BASE_URL: `http://127.0.0.1:${address.port}/v1`, OPENAI_MODEL: "gpt-4.1-mini" },
  });
  const stop = () => { child.kill("SIGTERM"); server.close(); };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
  child.on("exit", (code) => { server.close(); process.exit(code ?? 0); });
});
