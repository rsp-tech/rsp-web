import { jwtVerify } from "jose";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env["JWT_SECRET"];
const JWT_ISSUER = process.env["JWT_ISSUER"];
const JWT_AUDIENCE = process.env["JWT_AUDIENCE"];

export const POST = async (req: NextRequest) => {
  if (!JWT_SECRET || !JWT_ISSUER || !JWT_AUDIENCE) {
    return NextResponse.json(
      { error: "Missing JWT environment variables" },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
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
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const body = (await req.json()) as {
    paths?: string[];
    path?: string;
  };

  const paths = body.paths ?? (body.path ? [body.path] : []);

  if (paths.length === 0) {
    return NextResponse.json({ error: "No paths provided" }, { status: 400 });
  }

  const revalidated: string[] = [];

  for (const path of paths) {
    if (!path.startsWith("/")) {
      continue;
    }

    revalidatePath(path);
    revalidated.push(path);
  }

  return NextResponse.json({
    success: true,
    revalidated,
  });
};
