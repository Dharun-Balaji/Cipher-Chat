import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
    const data = await req.formData();
    const socketId = data.get("socket_id") as string;
    const channel = data.get("channel_name") as string;

    if (!socketId || !channel) {
        return new NextResponse("Missing socket_id or channel_name", { status: 400 });
    }

    // For presence channels, we need user info.
    // In a real app, you'd get this from the session.
    // Here we'll generate a random ID.
    const presenceData = {
        user_id: crypto.randomUUID(),
        user_info: {
            name: "Stranger",
        },
    };

    try {
        const authResponse = pusherServer.authorizeChannel(socketId, channel, presenceData);
        return NextResponse.json(authResponse);
    } catch (error) {
        console.error("Pusher auth error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
