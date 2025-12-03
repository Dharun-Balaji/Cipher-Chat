# Cipher Chat

A polished, production-ready anonymous chat application built with Next.js 14, Tailwind CSS, and Pusher.

## Features

- **Real-time Messaging**: Instant text chat with strangers.
- **Random Matching**: Connect with random users anonymously.
- **Polished UI**: Modern, dark-themed design with animations.
- **Responsive**: Works on mobile and desktop.

## Setup

1.  **Clone the repository**.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Set up Environment Variables**:
    Create a `.env.local` file in the root directory with your Pusher credentials:
    ```env
    NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
    NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
    PUSHER_APP_ID=your_pusher_app_id
    PUSHER_SECRET=your_pusher_secret
    ```
    > You can get these keys for free at [pusher.com](https://pusher.com).

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## Deployment on Vercel

1.  Push to GitHub.
2.  Import project in Vercel.
3.  Add the Environment Variables in Vercel Project Settings.
4.  Deploy!

## Note on Matching Logic

The current matching logic uses an in-memory queue which works for development and simple deployments. For a scalable production environment on Vercel (Serverless), you should integrate **Redis** (e.g., Upstash) to manage the waiting queue across multiple lambda instances.
