// lib/renewWatch.js
import cron from "node-cron";
import { getGmailClient } from "./googleClient.js";

export default function startRenewWatchCron() {
  async function renewGmailWatch() {
    try {
      const gmail = getGmailClient();
      const res = await gmail.users.watch({
        userId: "me",
        requestBody: {
          topicName: process.env.GOOGLE_PUBSUB_TOPIC,
          labelIds: ["INBOX"],
        },
      });
      console.log("✅ Gmail watch renewed:", res.data);
    } catch (err) {
      console.error("Error renewing Gmail watch:", err);
    }
  }

  // Run every 6 days at midnight
  cron.schedule("0 0 */6 * *", renewGmailWatch);

  // Optional: Run immediately on startup
  renewGmailWatch();
}
