import { getEnv } from "./config.ts";

const appriseUrl = getEnv("APPRISE_URL");
const appriseTitle =
  getEnv("APPRISE_TITLE") ?? getEnv("MAIL_SUBJECT") ?? "Bahnhof Price Change";

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
    throw new Error("❌ Apprise notification failed with exit code " + code + ".");
  }

  console.log("✅ Apprise notification sent");
}
