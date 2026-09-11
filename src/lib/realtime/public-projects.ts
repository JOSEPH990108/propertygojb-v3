import "server-only";

import Ably from "ably";

const PUBLIC_PROJECTS_CHANNEL = "public-projects";

function getAblyClient() {
  const apiKey = process.env.ABLY_API_KEY;

  return apiKey ? new Ably.Rest(apiKey) : null;
}

export async function publishPublicProjectsUpdate() {
  const ably = getAblyClient();

  if (!ably) {
    return;
  }

  await ably.channels
    .get(PUBLIC_PROJECTS_CHANNEL)
    .publish("project-updated", { updatedAt: Date.now() });
}

export async function createPublicProjectsTokenRequest() {
  const ably = getAblyClient();

  if (!ably) {
    return null;
  }

  return ably.auth.createTokenRequest({
    clientId: "public-site",
    capability: JSON.stringify({ [PUBLIC_PROJECTS_CHANNEL]: ["subscribe"] }),
  });
}