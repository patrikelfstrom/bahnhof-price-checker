import { dirname, fromFileUrl, join, load } from "./deps.ts";
import { sendMail } from "./sendMail.ts";

console.log("💸 Running Bahnhof Price Checker...");

const env = await load();

const environmentVariables = [
  "ADDRESS",
  "CURRENT_SPEED",
  "CURRENT_PRICE",
  "MAIL_SUBJECT",
  "MAIL_FROM",
  "MAIL_TO",
  "MAIL_HOST",
  "MAIL_PORT",
  "MAIL_USERNAME",
  "MAIL_PASSWORD",
];

for (const variable of environmentVariables) {
  if (Deno.env.has(variable) === false && env[variable] === undefined) {
    console.error(`❌ Required environment variable '${variable}' is not set.`);
    Deno.exit(1);
  }
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

if (stderr.length > 0) {
  Deno.stderr.writeSync(stderr);
}

if (code === 3) {
  if (stdout.length > 0) {
    Deno.stdout.writeSync(stdout);
  }

  const cleanResponse = response.replace(/(\[0;31m|\[0;32m|\[0m)/g, "");

  sendMail(cleanResponse, () => {
    Deno.exit(1);
  });
} else if (code !== 0) {
  if (stdout.length > 0) {
    Deno.stdout.writeSync(stdout);
  }
  Deno.exit(code);
} else {
  if (stdout.length > 0) {
    Deno.stdout.writeSync(stdout);
  }
  Deno.exit();
}
