import { getGmailClient } from "../../../lib/googleClient";
import fs from "fs";
import path from "path";

export async function GET() {
  return new Response("OK - PubSub Webhook Active", { status: 200 });
}

export async function POST(req) {
  try {
    const body = await req.json();

    if (!body.message?.data) {
      console.log("⚠ No data in Pub/Sub request");
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Decode Pub/Sub message
    const messageData = JSON.parse(
      Buffer.from(body.message.data, "base64").toString()
    );

    const historyId = Number(messageData.historyId);
    console.log("🔔 Gmail notification received!", { historyId });

    const gmail = getGmailClient();

    // Fetch only unread emails from developer@logicalquad.com
    const unreadList = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX", "UNREAD"],
      q: "from:misterevancarter@gmail.com is:unread",
    });

    const messages = unreadList.data.messages || [];

    if (messages.length === 0) {
      console.log("⚠ No new unread emails from misterevancarter@gmail.com");
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    for (const msg of messages) {
      // ✅ Mark email as read immediately to prevent duplicate processing
      await gmail.users.messages.modify({
        userId: "me",
        id: msg.id,
        resource: { removeLabelIds: ["UNREAD"] },
      });

      // Fetch full message content
      const message = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      const headers = message.data.payload.headers;
      const fromEmail = getHeader(headers, "From");

      // Skip if email is not from developer@logicalquad.com
      if (!fromEmail.includes("misterevancarter@gmail.com")) continue;

      console.log("📨 New Email Received:");
      console.log("From:", fromEmail);
      console.log("Subject:", getHeader(headers, "Subject"));
      console.log("Snippet:", message.data.snippet);
      console.log("--------------------------------");

      // Process attachments recursively
      const attachments = findAttachments(message.data.payload.parts);
      for (const part of attachments) {
        console.log("📎 Attachment found:", part.filename);

        // Fetch attachment data
        const attachment = await gmail.users.messages.attachments.get({
          userId: "me",
          messageId: msg.id,
          id: part.body.attachmentId,
        });

        // Convert from Base64 to buffer
        const data = Buffer.from(attachment.data.data, "base64");

        // Save attachment to local folder
        const saveFolder = "./downloads";
        fs.mkdirSync(saveFolder, { recursive: true });
        const filePath = path.join(saveFolder, part.filename);
        fs.writeFileSync(filePath, data);

        console.log(`📎 Attachment saved: ${filePath}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

// Helper to get header value
function getHeader(headers, name) {
  return headers.find((h) => h.name === name)?.value || "";
}

// Recursive function to find attachments in nested parts
function findAttachments(parts = []) {
  let attachments = [];
  for (const part of parts) {
    if (part.filename && part.body?.attachmentId) {
      attachments.push(part);
    }
    if (part.parts) {
      attachments = attachments.concat(findAttachments(part.parts));
    }
  }
  return attachments;
}
