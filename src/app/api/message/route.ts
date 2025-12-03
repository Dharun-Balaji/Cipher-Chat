import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
    const { channelName, text, senderId } = await req.json();

    if (!channelName || !text || !senderId) {
        return new NextResponse("Missing fields", { status: 400 });
    }

    try {
        await pusherServer.trigger(channelName, "new-message", {
            text,
            senderId,
            timestamp: Date.now(),
        });
        return NextResponse.json({ status: "sent" });
    } catch (error) {
        console.error("Pusher trigger error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
