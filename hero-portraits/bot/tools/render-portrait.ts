import { readFileSync } from "node:fs";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { prompt } from "@cursor/bdk";
import { defineTool } from "@cursor/bdk/tools";
import { Agent, type SDKMessage } from "@cursor/sdk";
import { z } from "zod";

const SIGN_IN =
  "No Cursor API key. Set CURSOR_API_KEY, or CURSOR_API_KEY_FILE, or CURSOR_SERVICE_ACCOUNT_KEY, or run `bdk login`.";

const inputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  epithet: z.string().trim().min(1).max(80),
  brief: z.string().trim().min(1).max(800),
});

type PortraitInput = z.infer<typeof inputSchema>;

type FoundImage = {
  bytes: Uint8Array;
  mimeType: string;
};

export default defineTool({
  description: prompt`
    Render one square fantasy-hero bust as a colored pencil and ink sketch.
    Face large enough to read as a thumbnail, simple background, no lettering.
  `,
  execution: "server",
  effect: "write",
  inputSchema,
  async execute(input, ctx) {
    const apiKey = resolveCursorApiKey();
    if (apiKey === undefined) {
      throw new Error(SIGN_IN);
    }

    const description = sketchPrompt(input);
    const found = await generateSketch(apiKey, description);
    const ext = extensionFor(found.mimeType);
    const file = `portraits/${slug(input.name)}.${ext}`;
    await ctx.host.files.write(file, found.bytes);

    return {
      content: [
        {
          type: "text",
          text: `${input.name} — ${input.epithet}`,
        },
        {
          type: "image",
          data: Buffer.from(found.bytes).toString("base64"),
          mimeType: found.mimeType,
        },
      ],
      structuredContent: {
        name: input.name,
        epithet: input.epithet,
        style: "colored-sketch",
        file,
        mimeType: found.mimeType,
        bytes: found.bytes.byteLength,
      },
    };
  },
});

function sketchPrompt(input: PortraitInput): string {
  return [
    "Square 1:1 bust portrait, colored pencil and ink sketch.",
    "Not paint, not a photograph.",
    "One person, head and shoulders only.",
    "Face large enough to read as a thumbnail.",
    "Simple flat background.",
    "No lettering, words, captions, or watermark.",
    `Hero: ${input.name}, ${input.epithet}.`,
    input.brief,
  ].join(" ");
}

async function generateSketch(apiKey: string, description: string): Promise<FoundImage> {
  const cwd = await mkdtemp(join(tmpdir(), "hero-portrait-"));
  const agent = await Agent.create({
    apiKey,
    name: "hero-portrait-render",
    model: { id: "grok-4.5", params: [{ id: "fast", value: "true" }] },
    mode: "agent",
    tools: ["generateImage"],
    local: { cwd, settingSources: [] },
  });

  try {
    const run = await agent.send(
      [
        "Call the generateImage tool exactly once, then stop.",
        `description: ${description}`,
        'filePath: "portrait.png"',
      ].join("\n"),
    );
    const events: SDKMessage[] = [];
    const timer = setTimeout(() => {
      void run.cancel();
    }, 120_000);
    try {
      for await (const event of run.stream()) {
        events.push(event);
      }
      await run.wait();
    } finally {
      clearTimeout(timer);
    }

    const fromResult = imageFromEvents(events);
    if (fromResult !== undefined) {
      return fromResult;
    }
    const fromDisk = await imageFromDir(cwd);
    if (fromDisk !== undefined) {
      return fromDisk;
    }
    throw new Error("generateImage did not return a portrait.");
  } finally {
    await agent[Symbol.asyncDispose]();
    await rm(cwd, { recursive: true, force: true });
  }
}

function imageFromEvents(events: SDKMessage[]): FoundImage | undefined {
  for (const event of events) {
    if (event.type !== "tool_call" || event.name !== "generateImage") {
      continue;
    }
    if (event.status === "error") {
      throw new Error("generateImage failed.");
    }
    if (event.status !== "completed") {
      continue;
    }
    const data = findString(event.result, "imageData");
    if (data !== undefined) {
      const bytes = decodeImage(data);
      if (bytes.byteLength > 32) {
        return { bytes, mimeType: mimeTypeOf(bytes) };
      }
    }
  }
  return undefined;
}

async function imageFromDir(cwd: string): Promise<FoundImage | undefined> {
  const names = await readdir(cwd, { recursive: true });
  for (const name of names) {
    const path = join(cwd, name.toString());
    if (!/\.(png|jpe?g|webp|gif)$/i.test(path)) {
      continue;
    }
    const bytes = new Uint8Array(await readFile(path));
    if (bytes.byteLength > 32) {
      return { bytes, mimeType: mimeTypeOf(bytes) };
    }
  }
  return undefined;
}

function findString(value: unknown, key: string): string | undefined {
  if (typeof value === "string") {
    try {
      return findString(JSON.parse(value), key);
    } catch {
      return undefined;
    }
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findString(item, key);
      if (found !== undefined) {
        return found;
      }
    }
    return undefined;
  }
  if (value === null || typeof value !== "object") {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  const direct = record[key];
  if (typeof direct === "string" && direct.trim() !== "") {
    return direct;
  }
  for (const nested of Object.values(record)) {
    const found = findString(nested, key);
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}

function decodeImage(data: string): Uint8Array {
  const trimmed = data.trim();
  const base64 = trimmed.startsWith("data:")
    ? trimmed.slice(trimmed.indexOf(",") + 1)
    : trimmed;
  return new Uint8Array(Buffer.from(base64, "base64"));
}

function mimeTypeOf(bytes: Uint8Array): string {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    return "image/png";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return "image/jpeg";
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49) {
    return "image/gif";
  }
  if (bytes[0] === 0x52 && bytes[1] === 0x49) {
    return "image/webp";
  }
  return "image/png";
}

function extensionFor(mimeType: string): string {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }
  if (mimeType === "image/webp") {
    return "webp";
  }
  if (mimeType === "image/gif") {
    return "gif";
  }
  return "png";
}

function slug(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned === "" ? "hero" : cleaned.slice(0, 60);
}

function resolveCursorApiKey(): string | undefined {
  const fromEnv = present("CURSOR_API_KEY");
  if (fromEnv !== undefined) {
    return fromEnv;
  }
  const fromFile = readKeyFile();
  if (fromFile !== undefined) {
    return fromFile;
  }
  const serviceAccount = present("CURSOR_SERVICE_ACCOUNT_KEY");
  if (serviceAccount !== undefined) {
    return serviceAccount;
  }
  return readLoginKey();
}

function present(name: string): string | undefined {
  const value = process.env[name];
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function readKeyFile(): string | undefined {
  const configured = present("CURSOR_API_KEY_FILE");
  const path = configured ?? "/run/cursor/secrets/CURSOR_API_KEY";
  return readTrimmed(path);
}

function readLoginKey(): string | undefined {
  const dir =
    process.env.AGENT_SERVE_CONFIG_DIR ??
    join(process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), "agent-serve");
  const raw = readTrimmed(join(dir, "credentials.json"));
  if (raw === undefined) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(raw) as { apiKey?: string };
    const key = parsed.apiKey?.trim();
    return key === undefined || key === "" ? undefined : key;
  } catch {
    return undefined;
  }
}

function readTrimmed(path: string): string | undefined {
  try {
    const raw = readFileSync(path, "utf8").trim();
    return raw === "" ? undefined : raw;
  } catch {
    return undefined;
  }
}
