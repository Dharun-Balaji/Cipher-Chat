import Link from "next/link";
import { MessageSquare, Users, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4">
      <main className="flex w-full max-w-4xl flex-col items-center text-center space-y-12">
        
        {/* Hero Section */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Cipher Chat</h1>
          </div>
          
          <h2 className="text-5xl sm:text-7xl font-extrabold tracking-tight bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent pb-2">
            Talk to Strangers.
          </h2>
          <p className="max-w-xl mx-auto text-lg text-muted-foreground leading-relaxed">
            Connect instantly with random people from around the world. 
            No login required. Completely anonymous.
          </p>
        </div>

        {/* CTA Button */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <Link 
            href="/chat"
            className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-primary px-8 font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            <span className="mr-2 text-lg">Start Chatting</span>
            <MessageSquare className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            1,234+ users online now
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-muted/30 border border-border/50">
            <Users className="w-6 h-6 text-primary" />
            <h3 className="font-semibold">Random Match</h3>
            <p className="text-sm text-muted-foreground">Instantly pair with someone new.</p>
          </div>
          <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-muted/30 border border-border/50">
            <Shield className="w-6 h-6 text-primary" />
            <h3 className="font-semibold">Anonymous</h3>
            <p className="text-sm text-muted-foreground">Your identity is kept private.</p>
          </div>
          <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-muted/30 border border-border/50">
            <MessageSquare className="w-6 h-6 text-primary" />
            <h3 className="font-semibold">Text Chat</h3>
            <p className="text-sm text-muted-foreground">Simple, fast text messaging.</p>
          </div>
        </div>

      </main>
      
      <footer className="absolute bottom-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Cipher Chat. Built for fun.
      </footer>
    </div>
  );
}
