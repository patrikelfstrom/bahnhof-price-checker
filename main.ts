import { dirname, fromFileUrl, join } from "./deps.ts";
import {
  getRequiredEnv,
  isAppriseConfigured,
  isMailConfigured,
  validateEnvironment,
} from "./config.ts";
import { sendApprise } from "./sendApprise.ts";
import { sendMail } from "./sendMail.ts";

console.log("💸 Running Bahnhof Price Checker...");

validateEnvironment();

const address = getRequiredEnv("ADDRESS");
const currentSpeed = getRequiredEnv("CURRENT_SPEED");
const currentPrice = getRequiredEnv("CURRENT_PRICE");
const currentDirectory = dirname(fromFileUrl(import.meta.url));

const command = new Deno.Command(join(currentDirectory, "./comparePrices.sh"), {
  args: [currentSpeed, currentPrice, address],
});

const { code, stdout, stderr } = command.outputSync();
const response = new TextDecoder().decode(stdout);

function writeOutputWithTrailingNewline(output: Uint8Array) {
  if (output.length === 0) {
    return;
  }

  Deno.stdout.writeSync(output);

  if (output[output.length - 1] !== 10) {
    Deno.stdout.writeSync(new TextEncoder().encode("\n"));
  }
}

function stripAnsiEscapeCodes(text: string) {
  return text.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "").trim();
}

if (stderr.length > 0) {
  Deno.stderr.writeSync(stderr);
}

if (code === 3) {
  writeOutputWithTrailingNewline(stdout);

  const cleanResponse = stripAnsiEscapeCodes(response);

  const notifications: Promise<void>[] = [];

  if (isMailConfigured()) {
    notifications.push(sendMail(cleanResponse));
  }

  if (isAppriseConfigured()) {
    notifications.push(sendApprise(cleanResponse));
  }

  const notificationResults = await Promise.allSettled(notifications);

  for (const result of notificationResults) {
    if (result.status === "rejected") {
      console.error(result.reason);
    }
  }

  Deno.exit(1);
} else if (code !== 0) {
  writeOutputWithTrailingNewline(stdout);
  Deno.exit(code);
} else {
  writeOutputWithTrailingNewline(stdout);
  Deno.exit();
}
