import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";
import { axiomLogger } from "@/lib/axiom-logger";

const JWT_SECRET = process.env["JWT_SECRET"];
const JWT_ISSUER = process.env["JWT_ISSUER"];
const JWT_AUDIENCE = process.env["JWT_AUDIENCE"];

export const verifyRevalidateAuth = async (
  req: NextRequest,
): Promise<NextResponse | null> => {
  if (!JWT_SECRET || !JWT_ISSUER || !JWT_AUDIENCE) {
    console.error(
      "[Revalidate Auth] Server missing JWT environment variables!",
    );
    axiomLogger.error(
      "[Revalidate Auth] Server missing JWT environment variables",
    );
    return NextResponse.json(
      { error: "Missing JWT environment variables" },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    console.warn(
      "[Revalidate Auth] Missing or invalid Authorization header:",
      authHeader,
    );
    return NextResponse.json(
      { error: "Missing Bearer token" },
      { status: 401 },
    );
  }

  try {
    await jwtVerify(authHeader.slice(7), new TextEncoder().encode(JWT_SECRET), {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return null; // Auth successful
  } catch (jwtErr) {
    console.error("[Revalidate Auth] JWT verification failed:", jwtErr);
    axiomLogger.warn("[Revalidate Auth] JWT verification failed", {
      error: jwtErr,
    });
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
};
