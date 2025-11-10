import { sendMail } from "./email";
import { prisma } from "./prisma";
import React from "react";

export async function enviarEmailLog({
  to,
  subject,
  template,
  react,
}: {
  to: string | string[];
  subject: string;
  template: string;
  react: React.ReactElement;
}) {
  const data = await sendMail({ to, subject, react });

  await prisma.emailLog.create({
    data: {
      to: Array.isArray(to) ? to.join(",") : to,
      subject,
      template,
      providerId: (data as any)?.id ?? null,
      status: "sent",
    },
  });
}

