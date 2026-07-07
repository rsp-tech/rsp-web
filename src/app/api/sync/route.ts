import { BACKUP_TOKEN, SYNC_ZIP_URL } from "@/constants";

export const revalidate = 604800; // 1 week

if (!BACKUP_TOKEN || !SYNC_ZIP_URL) {
  throw new Error("Missing backup configuration");
}

export const GET = async () => {
  try {
    const zipRes = await fetch(SYNC_ZIP_URL, {
      headers: {
        Authorization: `token ${BACKUP_TOKEN}`,
      },
    });

    if (!zipRes.ok) {
      return new Response("Failed to fetch backup", {
        status: zipRes.status,
      });
    }

    const headers = new Headers(zipRes.headers);

    if (!headers.has("Content-Disposition")) {
      headers.set("Content-Disposition", 'attachment; filename="sync.zip"');
    }

    return new Response(zipRes.body, {
      status: zipRes.status,
      headers,
    });
  } catch {
    return new Response("Failed to fetch backup", {
      status: 502,
    });
  }
};
