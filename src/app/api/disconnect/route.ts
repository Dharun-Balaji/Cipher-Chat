import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
    const { channelName } = await req.json();

    if (!channelName) {
        return new NextResponse("Missing channelName", { status: 400 });
    }

    try {
        await pusherServer.trigger(channelName, "disconnect", {});
        return NextResponse.json({ status: "disconnected" });
    } catch (error) {
        console.error("Pusher trigger error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
