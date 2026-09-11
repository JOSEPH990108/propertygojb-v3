import "server-only";

const MOCEAN_SMS_URL = "https://rest.moceanapi.com/rest/2/sms";

type MoceanSmsResponse = {
  messages?: Array<{
    status?: number;
  }>;
};

function getMoceanApiToken() {
  const apiToken = process.env.MOCEAN_API_TOKEN?.trim();

  if (!apiToken) {
    throw new Error("SMS delivery is temporarily unavailable.");
  }

  return apiToken;
}

export async function sendMoceanOtpSms(params: {
  phoneNumber: string;
  code: string;
}) {
  const response = await fetch(MOCEAN_SMS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getMoceanApiToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      "mocean-to": params.phoneNumber,
      "mocean-text": `PropertyGOJB: Your verification code is ${params.code}. It expires in 5 minutes. Do not share this code.`,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("SMS delivery is temporarily unavailable.");
  }

  const payload = (await response.json()) as MoceanSmsResponse;

  if (!payload.messages?.some((message) => message.status === 0)) {
    throw new Error("SMS delivery is temporarily unavailable.");
  }
}
