# Spotify Karaoke

A minimal and modern Next.js application that displays lyrics in karaoke style from songs playing on your Spotify account.

## Features

- 🎵 Automatic sync with Spotify playback from any device
- 🎤 Karaoke-style lyrics display with highlighting
- 🎼 Real-time synced lyrics from LRCLIB API
- 🔐 Secure Spotify OAuth authentication
- 🎨 Beautiful gradient background with smooth animations
- 📱 No controls or settings - just pure lyrics display

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Spoify-Karaoke2
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in the app details:
   - **App name**: Spotify Karaoke (or any name you prefer)
   - **App description**: Display Spotify lyrics in karaoke style
   - **Redirect URI**: `http://localhost:3000/api/auth/callback/spotify`
4. Save your app and note down the **Client ID** and **Client Secret**

### 4. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```env
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_random_secret_here
   ```

3. Generate a random secret for `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

### 5. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Click "Login with Spotify" on the home page
2. Authorize the application to access your Spotify playback
3. Play any song on your Spotify account (phone, desktop, web player, etc.)
4. Watch the lyrics appear in karaoke style on the screen!

## How It Works

- The app polls Spotify's API every 3 seconds to check what's currently playing
- When a new song is detected, it fetches synced lyrics from LRCLIB API
- If synced lyrics are available, they're displayed with precise timing
- If only plain lyrics are available, they're distributed evenly across the song duration
- Lyrics are displayed in sync with the song's playback position
- The current line is highlighted in large yellow text
- Previous lines fade out while upcoming lines appear in gray

## Lyrics Integration

This application uses the **LRCLIB API** to fetch lyrics for songs playing on Spotify. LRCLIB provides:

- **Synced Lyrics**: Precise timing data in LRC format for accurate karaoke display
- **Plain Lyrics**: Fallback for songs without timing data (automatically distributed across song duration)
- **No API Key Required**: Free, open API with no authentication needed

**Note:** If a song's lyrics aren't found on LRCLIB, the app will display placeholder lyrics as a fallback.

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **NextAuth.js** - Spotify OAuth
- **Spotify Web API** - Currently playing track data
- **LRCLIB API** - Synced and plain lyrics fetching

## Deployment

To deploy to production:

1. Update `NEXTAUTH_URL` in your environment variables to your production URL
2. Add the production callback URL to your Spotify app settings (e.g., `https://yourdomain.com/api/auth/callback/spotify`)
3. Add all environment variables to your hosting platform
4. Deploy to your preferred hosting platform (Vercel, Netlify, etc.)

```bash
pnpm build
pnpm start
```

## License

ISC
