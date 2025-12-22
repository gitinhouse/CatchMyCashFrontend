import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { sqsClient } from "./sqsClient";

export async function sendClaimToSQS(payload) {
  const command = new SendMessageCommand({
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify(payload),
    MessageAttributes: {
      eventType: {
        DataType: "String",
        StringValue: "CA_CLAIM_SUBMITTED",
      },
      source: {
        DataType: "String",
        StringValue: "NextJS-Web",
      },
    },
  });

  return await sqsClient.send(command);
}
