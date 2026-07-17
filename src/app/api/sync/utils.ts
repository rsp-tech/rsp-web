const BACKUP_TOKEN = process.env["BACKUP_TOKEN"];
const SYNC_ENDPOINT = process.env["SYNC_ENDPOINT"];

if (!BACKUP_TOKEN) {
  throw new Error("Missing BACKUP_TOKEN");
}

if (!SYNC_ENDPOINT) {
  throw new Error("Missing SYNC_ENDPOINT");
}

export const fetchBackupAsset = async (targetResource: string) => {
  const assetUrl = await fetch(SYNC_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${BACKUP_TOKEN}`,
    },
  })
    .then((res) => res.json())
    .then(
      ({ assets }) =>
        assets?.find(
          (a: { id: number; name: string }) => a.name === targetResource,
        ).url,
    );

  const assetRes = await fetch(assetUrl, {
    headers: {
      Authorization: `Bearer ${BACKUP_TOKEN}`,
      Accept: "application/octet-stream",
    },
    redirect: "follow",
  });

  if (!assetRes.ok) {
    console.error(await assetRes.text());
    return new Response("Failed to download seed", {
      status: assetRes.status,
    });
  }

  const headers = new Headers(assetRes.headers);
  return new Response(assetRes.body, {
    status: assetRes.status,
    headers,
  });
};
