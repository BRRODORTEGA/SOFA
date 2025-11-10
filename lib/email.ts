import { Resend } from "resend";
import { ENV } from "./env";

const resend = ENV.RESEND_API_KEY ? new Resend(ENV.RESEND_API_KEY) : null;

type SendMailArgs = {
  to: string | string[];
  subject: string;
  react?: React.ReactElement | React.ReactElement[];
  html?: string;
  text?: string;
  from?: string;
};

export async function sendMail(args: SendMailArgs) {
  if (!resend) {
    console.log("[DEV-email-mock]", args.subject, args.to);
    return { id: "dev-mock", status: "mocked" };
  }
  const { data, error } = await resend.emails.send({
    from: args.from || "Room2Go <no-reply@yourdomain.com>",
    to: args.to,
    subject: args.subject,
    react: args.react,
    html: args.html,
    text: args.text,
  });
  if (error) throw error;
  return data;
}

