import { load } from "std/dotenv";

const env = await load();

const appriseUrl = env["APPRISE_URL"] ?? Deno.env.get("APPRISE_URL");
const appriseTitle = env["APPRISE_TITLE"] ?? Deno.env.get("APPRISE_TITLE") ??
  env["MAIL_SUBJECT"] ?? Deno.env.get("MAIL_SUBJECT") ??
  "Bahnhof Price Change";

export async function sendApprise(text: string) {
  if (!appriseUrl) {
    return;
  }

  console.log("🔔 Sending Apprise notification...");

  const command = new Deno.Command("apprise", {
    args: ["-t", appriseTitle, "-b", text, appriseUrl],
  });

  const { code, stderr } = await command.output();

  if (stderr.length > 0) {
    Deno.stderr.writeSync(stderr);
  }

  if (code !== 0) {
    throw new Error(
      "❌ Apprise notification failed with exit code " + code + ".",
    );
  }

  console.log("✅ Apprise notification sent");
}
