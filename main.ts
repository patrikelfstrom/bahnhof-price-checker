import { load } from "std/dotenv";
import { dirname, fromFileUrl, join } from "std/path";
import { sendApprise } from "./sendApprise.ts";
import { sendMail } from "./sendMail.ts";

console.log("💸 Running Bahnhof Price Checker...");

const env = await load();

const environmentVariables = [
  "ADDRESS",
  "CURRENT_SPEED",
  "CURRENT_PRICE",
];

for (const variable of environmentVariables) {
  if (Deno.env.has(variable) === false && env[variable] === undefined) {
    console.error(`❌ Required environment variable '${variable}' is not set.`);
    Deno.exit(1);
  }
}

const mailEnvironmentVariables = [
  "MAIL_SUBJECT",
  "MAIL_FROM",
  "MAIL_TO",
  "MAIL_HOST",
  "MAIL_PORT",
  "MAIL_USERNAME",
  "MAIL_PASSWORD",
];

const getEnv = (variable: string) => env[variable] ?? Deno.env.get(variable);
const missingMailVariables = mailEnvironmentVariables.filter((variable) =>
  getEnv(variable) === undefined
);
const isMailConfigured = missingMailVariables.length === 0;
const isMailPartiallyConfigured =
  missingMailVariables.length < mailEnvironmentVariables.length;
const isAppriseConfigured = Boolean(getEnv("APPRISE_URL"));

if (isMailPartiallyConfigured && !isMailConfigured) {
  for (const variable of missingMailVariables) {
    console.error(`❌ Required environment variable '${variable}' is not set.`);
  }

  Deno.exit(1);
}

if (!isMailConfigured && !isAppriseConfigured) {
  console.error(
    "❌ At least one notification channel must be configured. Set APPRISE_URL or all MAIL_* variables.",
  );
  Deno.exit(1);
}

const address = env["ADDRESS"] ?? Deno.env.get("ADDRESS");
const currentSpeed = env["CURRENT_SPEED"] ?? Deno.env.get("CURRENT_SPEED");
const currentPrice = env["CURRENT_PRICE"] ?? Deno.env.get("CURRENT_PRICE");
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

  if (isMailConfigured) {
    notifications.push(sendMail(cleanResponse));
  }

  if (isAppriseConfigured) {
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
