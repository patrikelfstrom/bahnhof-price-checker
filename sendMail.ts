// @ts-types="npm:@types/nodemailer"
import * as nodemailer from "nodemailer";
import { load } from "std/dotenv";

const env = await load();

const mailSubject = env["MAIL_SUBJECT"] ?? Deno.env.get("MAIL_SUBJECT");
const mailFrom = env["MAIL_FROM"] ?? Deno.env.get("MAIL_FROM");
const mailTo = env["MAIL_TO"] ?? Deno.env.get("MAIL_TO");
const mailHost = env["MAIL_HOST"] ?? Deno.env.get("MAIL_HOST");
const mailPort = env["MAIL_PORT"] ?? Deno.env.get("MAIL_PORT");
const mailUsername = env["MAIL_USERNAME"] ?? Deno.env.get("MAIL_USERNAME");
const mailPassword = env["MAIL_PASSWORD"] ?? Deno.env.get("MAIL_PASSWORD");
const mailTextEncodingRaw = env["MAIL_TEXT_ENCODING"] ?? Deno.env.get("MAIL_TEXT_ENCODING");

const mailTextEncoding =
  mailTextEncodingRaw === "quoted-printable" || mailTextEncodingRaw === "base64"
    ? mailTextEncodingRaw
    : undefined;

export function sendMail(text: string) {
  console.log("💌 Sending mail...");

  const transporter = nodemailer.createTransport({
    host: mailHost,
    port: Number(mailPort),
    auth: {
      user: mailUsername,
      pass: mailPassword,
    },
  });

  return new Promise<void>((resolve, reject) => {
    transporter.sendMail(
      {
        from: mailFrom,
        to: mailTo,
        subject: mailSubject,
        text,
        textEncoding: mailTextEncoding,
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
