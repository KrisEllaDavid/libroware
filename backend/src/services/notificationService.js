const nodemailer = require("nodemailer");

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

const transporter = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || "587", 10),
      secure: parseInt(SMTP_PORT || "587", 10) === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
  : null;

if (!transporter) {
  console.log(
    "[notifications] SMTP_HOST not set — email notifications are disabled. " +
    "Set SMTP_HOST (and optionally SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM) to enable."
  );
}

async function sendMail({ to, subject, html, text }) {
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error(`[notifications] Failed to send to ${to} — ${subject}:`, err.message);
  }
}

// Returns { gte: start-of-day, lt: start-of-next-day } for N days from now.
function dayRange(daysFromNow) {
  const start = new Date();
  start.setDate(start.getDate() + daysFromNow);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { gte: start, lt: end };
}

function bookLine(borrow) {
  const authors = borrow.book.authors?.map((a) => a.name).join(", ");
  return authors ? `${borrow.book.title} by ${authors}` : borrow.book.title;
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function dueSoonHtml(borrow) {
  return `
<p>Hi ${borrow.user.firstName},</p>
<p>This is a friendly reminder that <strong>${bookLine(borrow)}</strong>
is due back in <strong>3 days</strong> (${fmtDate(borrow.dueDate)}).
Please return it on time to avoid late fees.</p>
<p>— Libroware</p>`;
}

function dueTodayHtml(borrow) {
  return `
<p>Hi ${borrow.user.firstName},</p>
<p><strong>${bookLine(borrow)}</strong> is due back <strong>today</strong>
(${fmtDate(borrow.dueDate)}). Please return it today to avoid late fees.</p>
<p>— Libroware</p>`;
}

function overdueHtml(borrow, daysOverdue) {
  return `
<p>Hi ${borrow.user.firstName},</p>
<p><strong>${bookLine(borrow)}</strong> was due on ${fmtDate(borrow.dueDate)}
and is now <strong>${daysOverdue} day(s) overdue</strong>.
Please return it as soon as possible — daily late fees are accruing.</p>
<p>— Libroware</p>`;
}

async function notifyDueDates(prisma) {
  if (!transporter) return;

  const include = { user: true, book: { include: { authors: true } } };

  // 1. Due in exactly 3 days
  const dueSoon = await prisma.borrow.findMany({
    where: { status: "BORROWED", dueDate: dayRange(3) },
    include,
  });
  for (const b of dueSoon) {
    await sendMail({
      to: b.user.email,
      subject: `Reminder: "${b.book.title}" is due in 3 days`,
      text: `Hi ${b.user.firstName},\n\n"${bookLine(b)}" is due back on ${fmtDate(b.dueDate)} (in 3 days). Please return it on time to avoid late fees.\n\n— Libroware`,
      html: dueSoonHtml(b),
    });
  }

  // 2. Due today
  const dueToday = await prisma.borrow.findMany({
    where: { status: "BORROWED", dueDate: dayRange(0) },
    include,
  });
  for (const b of dueToday) {
    await sendMail({
      to: b.user.email,
      subject: `Reminder: "${b.book.title}" is due today`,
      text: `Hi ${b.user.firstName},\n\n"${bookLine(b)}" is due back today (${fmtDate(b.dueDate)}). Please return it today to avoid late fees.\n\n— Libroware`,
      html: dueTodayHtml(b),
    });
  }

  // 3. Overdue — bulk-update any BORROWED that crossed the deadline, then notify all OVERDUE
  await prisma.borrow.updateMany({
    where: { status: "BORROWED", dueDate: { lt: new Date() } },
    data: { status: "OVERDUE" },
  });

  const overdue = await prisma.borrow.findMany({
    where: { status: "OVERDUE" },
    include,
  });
  for (const b of overdue) {
    const daysOverdue = Math.max(
      1,
      Math.ceil((Date.now() - new Date(b.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    );
    await sendMail({
      to: b.user.email,
      subject: `Overdue notice: "${b.book.title}" (${daysOverdue}d late)`,
      text: `Hi ${b.user.firstName},\n\n"${bookLine(b)}" was due on ${fmtDate(b.dueDate)} and is now ${daysOverdue} day(s) overdue. Please return it as soon as possible — daily late fees are accruing.\n\n— Libroware`,
      html: overdueHtml(b, daysOverdue),
    });
  }

  console.log(
    `[notifications] ${dueSoon.length} due-in-3d, ${dueToday.length} due-today, ${overdue.length} overdue reminders sent`
  );
}

module.exports = { notifyDueDates, sendMail };
