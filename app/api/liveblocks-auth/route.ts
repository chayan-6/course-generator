import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  // 1. Get the current user
  const { userId } = await auth();
  const user = await currentUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  // 2. Read the Room ID from the request
  const { room } = await request.json();

  // 3. Prepare the session
  const session = liveblocks.prepareSession(
    `user-${userId}`,
    {
      userInfo: {
        name: user.firstName || "Anonymous",
        picture: user.imageUrl,
      },
    }
  );

  // 4. Give Full Access to the Room
  session.allow(room, session.FULL_ACCESS);

  // 5. Authorize
  const { body, status } = await session.authorize();
  return new NextResponse(body, { status });
}