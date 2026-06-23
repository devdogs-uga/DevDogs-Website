import { NextResponse } from "next/server";
import { env } from "~/env";
import { revalidateDocPaths } from "~/server/docs/revalidate";

const enc = new TextEncoder();

async function verifySignature(
  body: string,
  signature: string | null,
): Promise<boolean> {
  if (!signature || !env.GITHUB_WEBHOOK_SECRET) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(env.GITHUB_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const expected = "sha256=" + Buffer.from(mac).toString("hex");
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

interface PushEvent {
  ref: string;
  repository: { name: string };
  commits: {
    added: string[];
    modified: string[];
    removed: string[];
  }[];
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!(await verifySignature(body, signature))) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const event = request.headers.get("x-github-event");
  if (event !== "push") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let payload: PushEvent;
  try {
    payload = JSON.parse(body) as PushEvent;
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const repo = payload.repository.name;
  // ref is "refs/heads/<branch>"
  const branch = payload.ref.replace(/^refs\/heads\//, "");

  const added: string[] = [];
  const modified: string[] = [];
  const removed: string[] = [];

  for (const commit of payload.commits) {
    added.push(...commit.added);
    modified.push(...commit.modified);
    removed.push(...commit.removed);
  }

  revalidateDocPaths(repo, branch, added, modified, removed);

  return NextResponse.json({ ok: true, repo, branch });
}
