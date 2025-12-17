import { getGmailClient } from "../../../lib/googleClient";

export async function GET() {
  try {
    const gmail = getGmailClient();

    const res = await gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName: process.env.GOOGLE_PUBSUB_TOPIC,
        labelIds: ["INBOX"],
      },
    });

    return Response.json({ success: true, data: res.data });
  } catch (err) {
    console.error("Watch Error:", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
