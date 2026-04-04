import signIn from "~/server/actions/signIn";

export async function GET() {
  await signIn();
}
