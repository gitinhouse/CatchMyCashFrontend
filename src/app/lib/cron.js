import cron from "node-cron";
import { downloadAndExtractSCO } from "./downloadSCO.js"; 

async function myScheduledFunction() {
  console.log("Running scheduled job...");
  await downloadAndExtractSCO();
}
// "0 9 * * 5"
const startCronJobs = () => {
  cron.schedule(
    "0 9 * * 5",
    () => {
        console.log('--running');
      myScheduledFunction();
      
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log("Cron job scheduled to work on 9 AM IST");
};

export default startCronJobs;
