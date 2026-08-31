import nodemailer from 'nodemailer'

export async function sendReportEmail({ config, period, html, text, attachmentPath }) {
  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  })

  const subject = `${config.clientName} — Website Analytics Report (${period.label})`

  await transporter.sendMail({
    from: config.smtp.from,
    to: config.reportTo,
    cc: config.reportCc.length ? config.reportCc : undefined,
    subject,
    text,
    html: `<p>Please find the attached monthly analytics report for <strong>${config.clientName}</strong> (${period.label}).</p><pre style="font-family: sans-serif; white-space: pre-wrap;">${text}</pre>`,
    attachments: [
      {
        filename: `TCTE-GA4-Report-${period.slug}.html`,
        path: attachmentPath,
        contentType: 'text/html',
      },
    ],
  })

  return subject
}
