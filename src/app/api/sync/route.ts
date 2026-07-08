export const revalidate = 604800; // 1 week

const BACKUP_TOKEN = process.env["BACKUP_TOKEN"];
const SYNC_ENDPOINT = process.env["SYNC_ENDPOINT"];
const SYNC_RESOURCE = process.env["SYNC_RESOURCE"];

if (!BACKUP_TOKEN) {
  throw new Error("Missing BACKUP_TOKEN");
}

if (!SYNC_ENDPOINT) {
  throw new Error("Missing SYNC_ENDPOINT");
}

if (!SYNC_RESOURCE) {
  throw new Error("Missing BACKUP_FILE");
}

export const GET = async () => {
  try {
    const assetId = await fetch(SYNC_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${BACKUP_TOKEN}`,
      },
    })
      .then((res) => res.json())
      .then(
        ({ assets }) =>
          assets.find(
            (a: { id: number; name: string }) => a.name === SYNC_RESOURCE,
          ).id,
      );

    const assetRes = await fetch(
      `${SYNC_ENDPOINT.split("tags")[0]}assets/${assetId}`,
      {
        headers: {
          Authorization: `Bearer ${BACKUP_TOKEN}`,
          Accept: "application/octet-stream",
        },
        redirect: "follow",
      },
    );

    if (!assetRes.ok) {
      console.error(await assetRes.text());

      return new Response("Failed to download backup", {
        status: assetRes.status,
      });
    }

    const headers = new Headers(assetRes.headers);

    return new Response(assetRes.body, {
      status: assetRes.status,
      headers,
    });
  } catch (error) {
    console.error(error);

    return new Response("Failed to fetch backup", {
      status: 502,
    });
  }
};
