import { NextResponse } from "next/server";

export const GET = () => {
  return NextResponse.json(
    {
      status: "healthy",
      service: "rsp-web",
    },
    {
      status: 200,
      headers: {
        "Cache-Control":
          "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
};

export const HEAD = () => {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control":
        "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
    },
  });
};
