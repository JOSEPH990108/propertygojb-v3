import "server-only";

import { getWhatsAppWebhookConfig } from "./webhook";

export function getWhatsAppCloudApiConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const config = getWhatsAppWebhookConfig();

  if (!accessToken) {
    throw new Error("WHATSAPP_ACCESS_TOKEN is required for Cloud API operations.");
  }

  return {
    ...config,
    accessToken,
    baseUrl: `https://graph.facebook.com/${config.graphApiVersion}`,
  };
}