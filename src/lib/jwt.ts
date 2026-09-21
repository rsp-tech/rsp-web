import { SignJWT } from "jose";

export const generateM2MToken = async (audience_?: string): Promise<string> => {
  const secretStr = process.env["JWT_SECRET"];
  const issuer = process.env["JWT_ISSUER"];
  const audience = audience_ || process.env["JWT_AUDIENCE"];

  if (!secretStr || !issuer || !audience) {
    throw new Error("Missing JWT configuration environment variables.");
  }

  const secret = new TextEncoder().encode(secretStr);
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now - 300)
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime(now + 900)
    .sign(secret);
};
