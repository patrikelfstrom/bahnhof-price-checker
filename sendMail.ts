import { getEnv } from "./config.ts";
import { nodemailer } from "./deps.ts";

const mailSubject = getEnv("MAIL_SUBJECT");
const mailFrom = getEnv("MAIL_FROM");
const mailTo = getEnv("MAIL_TO");
const mailHost = getEnv("MAIL_HOST");
const mailPort = getEnv("MAIL_PORT");
const mailUsername = getEnv("MAIL_USERNAME");
const mailPassword = getEnv("MAIL_PASSWORD");

export function sendMail(text: string) {
  console.log("💌 Sending mail...");

  const transporter = nodemailer.createTransport({
    host: mailHost!,
    port: Number(mailPort!),
    auth: {
      user: mailUsername!,
      pass: mailPassword!,
    },
  });

  return new Promise<void>((resolve, reject) => {
    transporter.sendMail(
      {
        from: mailFrom!,
        to: mailTo!,
        subject: mailSubject!,
        text,
      },
      (error) => {
        if (error) {
          const message = error instanceof Error
            ? error.message
            : String(error);

          reject(new Error("❌ Mail notification failed: " + message));
          return;
        }

        console.log("✅ Mail sent");
        resolve();
      },
    );
  });
}
