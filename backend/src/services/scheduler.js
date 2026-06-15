const cron = require("node-cron");
const { notifyDueDates } = require("./notificationService");

function startNotificationScheduler(prisma) {
  // Default: run every day at 08:00 server time. Override with NOTIFICATION_CRON env var.
  const schedule = process.env.NOTIFICATION_CRON || "0 8 * * *";

  if (!cron.validate(schedule)) {
    console.error(`[scheduler] Invalid NOTIFICATION_CRON expression "${schedule}" — notification job not started`);
    return;
  }

  cron.schedule(schedule, () => {
    notifyDueDates(prisma).catch((err) =>
      console.error("[scheduler] Due-date notification job failed:", err.message)
    );
  });

  console.log(`[scheduler] Due-date notification job scheduled (${schedule})`);
}

module.exports = { startNotificationScheduler };
