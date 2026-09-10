import type { MetadataRoute } from "next";

import { isProduction } from "@/config/app";
import { getPublicRobotsFile } from "@/lib/public/seo";

export default function robots(): MetadataRoute.Robots {
  return getPublicRobotsFile(isProduction());
}
