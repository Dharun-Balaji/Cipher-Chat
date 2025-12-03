"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Send, StopCircle, RefreshCw, MessageSquare, Loader2 } from "lucide-react";
import { pusherClient } from "@/lib/pusher";
import { Channel } from "pusher-js";

type Message = {
  id: string;
  text: string;
  sender: "me" | "stranger" | "system";
  timestamp: number;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [status, setStatus] = useState<"idle" | "searching" | "connected" | "disconnected">("idle");
  const [channel, setChannel] = useState<Channel | null>(null);
  const [myId, setMyId] = useState<string>("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Generate a random ID for this session
    const id = Math.random().toString(36).substring(7);
    setMyId(id);

    // Connect to Pusher
    pusherClient.connect();

    return () => {
      if (channel) {
        channel.unbind_all();
        channel.unsubscribe();
      }
      pusherClient.disconnect();
    };
  }, []);

  const startChat = async () => {
    if (status === "searching" || status === "connected") return;

    setStatus("searching");
    setMessages([{ id: "sys-1", text: "Looking for a stranger...", sender: "system", timestamp: Date.now() }]);

    // Subscribe to my own channel to receive match notifications
    // We use the socketId as the unique identifier for matching
    // But we need to get the socketId first.
    // Actually, we can just use a temporary channel or pass the socketId if we can access it.
    // pusherClient.connection.socket_id is available after connection.
    
    if (!pusherClient.connection.socket_id) {
      // Wait for connection
      pusherClient.connection.bind("connected", () => {
        findMatch();
      });
    } else {
      findMatch();
    }
  };

  const findMatch = async () => {
    const socketId = pusherClient.connection.socket_id;
    
    // Listen for match events on my socketId (using a private channel or just binding to the connection if possible? 
    // Pusher doesn't allow binding to connection for custom events easily without a channel.
    // We'll use a private channel named after the socketId? No, that requires auth.
    // Let's use the API response to tell us the channel, OR use the socketId to trigger an event to THIS user.
    // The server can trigger an event to a specific socketId without a channel using `pusher.trigger(socketId, ...)`? 
    // No, `trigger` takes a channel name.
    // But we can use `user_id` if we use authenticated users.
    // Since we are anonymous, we can use a temporary private channel `private-user-<socketId>`?
    // Or just rely on the API response?
    // The API response might hang if we use long-polling? No, Vercel has timeouts.
    // BEST APPROACH:
    // 1. Client calls /api/match with socketId.
    // 2. Server checks queue.
    // 3. If match found, server returns { status: 'matched', channelName: '...' }.
    // 4. If no match, server adds to queue and returns { status: 'waiting' }.
    // 5. If waiting, Client subscribes to `private-waiting-<socketId>`? 
    //    Or Server triggers 'match-found' on `private-waiting-<socketId>` when a match is found later.
    
    // Let's use `private-user-${socketId}` for personal notifications.
    const myChannelName = `private-user-${socketId}`;
    const myChannel = pusherClient.subscribe(myChannelName);
    
    myChannel.bind("pusher:subscription_succeeded", async () => {
       // Now call match API
       try {
         const res = await fetch("/api/match", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ socketId }),
         });
         const data = await res.json();
         
         if (data.status === "matched") {
           handleMatch(data.channelName);
         }
         // If waiting, we just wait for the event on myChannel
       } catch (error) {
         console.error("Match error:", error);
         setStatus("idle");
         setMessages(prev => [...prev, { id: "err", text: "Error finding match.", sender: "system", timestamp: Date.now() }]);
       }
    });

    myChannel.bind("match-found", (data: { channelName: string }) => {
      handleMatch(data.channelName);
    });
  };

  const handleMatch = (channelName: string) => {
    // Unsubscribe from waiting channel
    const socketId = pusherClient.connection.socket_id;
    pusherClient.unsubscribe(`private-user-${socketId}`);

    setStatus("connected");
    setMessages([{ id: "sys-2", text: "You're now chatting with a random stranger. Say hi!", sender: "system", timestamp: Date.now() }]);

    // Subscribe to the shared chat channel
    const chatChannel = pusherClient.subscribe(channelName);
    setChannel(chatChannel);

    chatChannel.bind("new-message", (data: { text: string, senderId: string }) => {
      if (data.senderId !== myId) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), text: data.text, sender: "stranger", timestamp: Date.now() },
        ]);
      }
    });

    chatChannel.bind("disconnect", () => {
      setChannel(null); // Stop sending messages
      setStatus("disconnected");
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: "Stranger has disconnected.", sender: "system", timestamp: Date.now() },
      ]);
      // We don't unbind/unsubscribe immediately so the user can still see the chat? 
      // Actually, if we setChannel(null), we can't send.
      // But we should probably unsubscribe to clean up.
      pusherClient.unsubscribe(channelName);
    });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || status !== "connected" || !channel) return;

    const text = inputText;
    setInputText("");
    
    // Optimistic update
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text: text, sender: "me", timestamp: Date.now() },
    ]);

    try {
      await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelName: channel.name,
          text,
          senderId: myId,
        }),
      });
    } catch (error) {
      console.error("Send error:", error);
    }
  };

  const handleDisconnect = async () => {
    if (channel) {
      // Notify stranger
      try {
        await fetch("/api/disconnect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelName: channel.name }),
        });
      } catch (error) {
        console.error("Disconnect error:", error);
      }

      channel.unbind_all();
      channel.unsubscribe();
      setChannel(null);
    }
    setStatus("disconnected");
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text: "You have disconnected.", sender: "system", timestamp: Date.now() },
    ]);
  };

  const handleNewChat = () => {
    handleDisconnect();
    // Small delay to ensure cleanup
    setTimeout(() => {
      startChat();
    }, 100);
  };

  // Start chat automatically on mount or first visit?
  // Let's wait for user to click "New Chat" or if they came from "Start" button?
  // For now, let's make them click "New Chat" or "Start" if status is idle.
  
  useEffect(() => {
      // Auto start on first load
      startChat();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg hidden sm:inline-block">Cipher Chat</span>
        </Link>
        
        <div className="flex items-center space-x-2">
          {status === "connected" || status === "searching" ? (
            <button 
              onClick={handleDisconnect}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium"
            >
              <StopCircle className="w-4 h-4" />
              <span>Stop</span>
            </button>
          ) : (
            <button 
              onClick={handleNewChat}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              <span>New Chat</span>
            </button>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex w-full ${
              msg.sender === "me" ? "justify-end" : 
              msg.sender === "system" ? "justify-center" : "justify-start"
            }`}
          >
            {msg.sender === "system" ? (
              <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full flex items-center gap-2">
                {status === "searching" && msg.text.includes("Looking") && <Loader2 className="w-3 h-3 animate-spin" />}
                {msg.text}
              </span>
            ) : (
              <div 
                className={`max-w-[80%] sm:max-w-[70%] px-4 py-2 rounded-2xl break-words ${
                  msg.sender === "me" 
                    ? "bg-primary text-primary-foreground rounded-br-none" 
                    : "bg-muted text-foreground rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="p-4 border-t border-border bg-background">
        <form 
          onSubmit={handleSendMessage}
          className={`flex items-center space-x-2 max-w-4xl mx-auto ${status !== 'connected' ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={status === "connected" ? "Type a message..." : "Waiting for connection..."}
            className="flex-1 bg-muted/50 border-none focus:ring-2 focus:ring-primary/50 rounded-full px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none transition-all"
            disabled={status !== "connected"}
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || status !== "connected"}
            className="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </footer>
    </div>
  );
}
