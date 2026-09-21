export const uploadQueryAttachmentToDrive = async (
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> => {
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("File size exceeds 15MB limit.");
  }

  const sessionRes = await fetch("/api/queries/upload-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      origin:
        typeof window !== "undefined" ? window.location.origin : undefined,
    }),
  });

  const sessionData = await sessionRes.json();
  if (!sessionRes.ok || sessionData.error) {
    throw new Error(sessionData.error || "Failed to create upload session");
  }

  const { sessionUrl, uniqueFileName } = sessionData;

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", sessionUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (parsed.id) {
            return resolve(parsed.id);
          }
        } catch {
          // If JSON parsing fails due to CORS, fallback to uniqueFileName
        }
        resolve(uniqueFileName);
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      // In some browsers, Google Drive's 200 OK triggers an error due to CORS header masking
      resolve(uniqueFileName);
    };

    xhr.send(file);
  });
};
