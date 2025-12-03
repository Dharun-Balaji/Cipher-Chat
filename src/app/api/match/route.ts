import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

// NOTE: In a serverless environment like Vercel, this global variable
// will not be shared across different lambda instances.
// For production, you MUST use Redis (e.g., Upstash or Vercel KV) to store the waiting user.
let waitingUser: { socketId: string; channelName: string } | null = null;

export async function POST(req: Request) {
    const { socketId } = await req.json();

    if (!socketId) {
        return new NextResponse("Missing socketId", { status: 400 });
    }

    // If there is a waiting user, match with them
    if (waitingUser && waitingUser.socketId !== socketId) {
        const partner = waitingUser;
        waitingUser = null; // Clear waiting user

        const matchChannel = `private-chat-${partner.socketId}-${socketId}`;

        // Notify both users
        // Notify the waiting user on their private channel
        await pusherServer.trigger(`private-user-${partner.socketId}`, "match-found", {
            channelName: matchChannel,
            role: "initiator",
        });

        // Notify the current user (response will handle it, but we can also trigger event)
        // The current user gets the channel from the API response, so we don't strictly need to trigger an event to them,
        // but for consistency we can. However, the client code handles the API response.
        // Let's just return the channel name to the current user.

        return NextResponse.json({ status: "matched", channelName: matchChannel });
    } else {
        // No one waiting, add to waiting list
        waitingUser = { socketId, channelName: "waiting" };
        return NextResponse.json({ status: "waiting" });
    }
}
