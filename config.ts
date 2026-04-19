import { load } from "./deps.ts";

const env = await load();

export const mailEnvironmentVariables = [
  "MAIL_SUBJECT",
  "MAIL_FROM",
  "MAIL_TO",
  "MAIL_HOST",
  "MAIL_PORT",
  "MAIL_USERNAME",
  "MAIL_PASSWORD",
];

export function getEnv(variable: string) {
  return env[variable] ?? Deno.env.get(variable);
}

export function getRequiredEnv(variable: string) {
  const value = getEnv(variable);

  if (value === undefined) {
    console.error(`❌ Required environment variable '${variable}' is not set.`);
    Deno.exit(1);
  }

  return value;
}

export function isMailConfigured() {
  return mailEnvironmentVariables.every((variable) => Boolean(getEnv(variable)));
}

export function isAppriseConfigured() {
  return Boolean(getEnv("APPRISE_URL"));
}

export function validateEnvironment(options: { includeCron?: boolean } = {}) {
  const requiredVariables = [
    "ADDRESS",
    "CURRENT_SPEED",
    "CURRENT_PRICE",
  ];

  if (options.includeCron) {
    requiredVariables.push("CRON_SCHEDULE");
  }

  for (const variable of requiredVariables) {
    getRequiredEnv(variable);
  }

  const isMailPartiallyConfigured = mailEnvironmentVariables.some((variable) =>
    getEnv(variable) !== undefined
  );

  if (isMailPartiallyConfigured && !isMailConfigured()) {
    for (const variable of mailEnvironmentVariables) {
      if (getEnv(variable) === undefined) {
        console.error(`❌ Required environment variable '${variable}' is not set.`);
      }
    }

    Deno.exit(1);
  }

  if (!isMailConfigured() && !isAppriseConfigured()) {
    console.error(
      "❌ At least one notification channel must be configured. Set APPRISE_URL or all MAIL_* variables.",
    );
    Deno.exit(1);
  }
}
