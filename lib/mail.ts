import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendAnnouncementEmail(to: string, subject: string, message: string, senderName: string) {
  if (!resend) {
    // No API key configured yet — log instead of failing, so the rest of
    // the app (and local dev) keeps working before Resend is set up.
    console.log(`[mail:skipped — no RESEND_API_KEY] to=${to} subject=${subject}`);
    return { skipped: true };
  }
  return resend.emails.send({
    from: process.env.MAIL_FROM || "Sophia Way Portal <notifications@sophiaway.org>",
    to,
    subject: `[Sophia Way Portal] ${subject}`,
    text: `${message}\n\n— ${senderName}\n\nSent via the Sophia Way member portal.`,
    html: `<p>${message.replace(/\n/g, "<br/>")}</p><p style="color:#888;font-size:13px;">— ${senderName}<br/>Sent via the Sophia Way member portal.</p>`,
  });
}
