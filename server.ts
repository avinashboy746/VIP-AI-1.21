import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Client, GatewayIntentBits, ActivityType, EmbedBuilder } from "discord.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Gemini Setup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in server environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}
const model = "gemini-3.5-flash";

// Discord Bot Setup
const bot = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ] 
});

// In-memory conversational history for Discord channels/users (limit to last 10 messages to keep context/prevent blowup)
const discordConversations = new Map<string, { role: "user" | "model"; parts: { text: string }[] }[]>();

if (process.env.DISCORD_BOT_TOKEN) {
  bot.login(process.env.DISCORD_BOT_TOKEN).then(() => {
    console.log(`Bot logged in as ${bot.user?.tag}`);
    
    // Set Default Presence
    bot.user?.setPresence({
      activities: [{ name: 'Serving VIPs • !help', type: ActivityType.Watching }],
      status: 'online',
    });
  }).catch(err => {
    console.error("Failed to login bot: Check if DISCORD_BOT_TOKEN is valid.", err);
  });
} else {
  console.warn("DISCORD_BOT_TOKEN is missing in environment variables.");
}

// Welcome Message
bot.on('guildMemberAdd', (member) => {
  const channel = member.guild.systemChannel;
  if (channel) {
    const welcomeEmbed = new EmbedBuilder()
      .setColor('#dc2626')
      .setTitle('VIP ACCESS GRANTED')
      .setDescription(`Welcome **${member.user.username}** to the elite terminal. You are now part of the VIP inner circle.`)
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();
    
    channel.send({ content: `Welcome <@${member.id}>!`, embeds: [welcomeEmbed] });
  }
});

bot.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // AI Chat (Reply to mentions or messages starting with 'vip ')
  const isMentioned = message.mentions.has(bot.user!);
  const isCommand = message.content.toLowerCase().startsWith('vip ');

  if (isMentioned || isCommand) {
    const prompt = message.content.replace(`<@${bot.user?.id}>`, '').replace(/vip /i, '').trim();
    if (!prompt) return;

    try {
      await message.channel.sendTyping();

      const systemInstruction = "You are 'VIP AI CHAT', the elite AI assistant. You are professional, authoritative, and helpful. You speak in Hindi, Hinglish, and English. Match the conversation language and remember the history of this discussion to give continuous, relevant answers.";
      
      const convoKey = `${message.channelId}-${message.author.id}`;
      let history = discordConversations.get(convoKey) || [];

      // Add user's latest query
      history.push({
        role: "user",
        parts: [{ text: prompt }]
      });

      // Keep only last 10 messages (5 turns)
      if (history.length > 10) {
        history = history.slice(history.length - 10);
      }

      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: model,
        contents: history,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const text = response.text || "Terminal error: No response generated.";

      // Add model's latest reply to conversational memory
      history.push({
        role: "model",
        parts: [{ text: text }]
      });
      discordConversations.set(convoKey, history);

      // Split text if it's too long (Discord limit is 2000 chars)
      if (text.length > 2000) {
        const chunks = text.match(/[\s\S]{1,2000}/g) || [];
        for (const chunk of chunks) {
          await message.reply(chunk);
        }
      } else {
        await message.reply(text);
      }
    } catch (error) {
      console.error("AI Chat error", error);
      message.reply("Terminal error: Could not process request. Check system status.");
    }
    return;
  }

  // Commands
  if (message.content === '!ping') {
    message.reply('Pong! VIP AI CHAT is active.');
  }

  if (message.content === '!help') {
    const helpEmbed = new EmbedBuilder()
      .setColor('#2563eb')
      .setTitle('VIP AI CHAT COMMANDS')
      .addFields(
        { name: '!vipchat', value: 'Access exclusive VIP features.' },
        { name: '!music', value: 'Show top music lists.' },
        { name: '!status <text>', value: 'Set bot status (Admin).' },
        { name: 'vip <question>', value: 'Ask VIP AI CHAT anything.' },
        { name: '!ping', value: 'Check bot latency.' }
      );
    message.reply({ embeds: [helpEmbed] });
  }

  if (message.content === '!vipchat') {
    message.reply('🔥 **VIP Chat Protocol Activated.** In this chat, you get priority AI generation, expert code architecture, and direct master access. Use `vip <your request>` to start plotting with the AI.');
  }

  if (message.content === '!music') {
    const musicEmbed = new EmbedBuilder()
      .setColor('#2563eb')
      .setTitle('🎵 VIP TOP CHART')
      .addFields(
        { name: '1. Starboy', value: 'The Weeknd' },
        { name: '2. Blinding Lights', value: 'The Weeknd' },
        { name: '3. Lucid Dreams', value: 'Juice WRLD' },
        { name: '4. Rockstar', value: 'Post Malone' },
        { name: '5. Heathens', value: 'Twenty One Pilots' }
      )
      .setFooter({ text: 'VIP Selection • Updated Hourly' });
    message.reply({ embeds: [musicEmbed] });
  }

  // Set Status Command (Admin Only - simplified for demo)
  if (message.content.startsWith('!status ')) {
    const newStatus = message.content.replace('!status ', '');
    bot.user?.setPresence({
      activities: [{ name: newStatus, type: ActivityType.Playing }],
      status: 'online',
    });
    message.reply(`✅ Bot status updated to: **${newStatus}**`);
  }
});

// Session & Cookie Setup (Safe for iframes)
app.use(cookieParser());
app.use(session({
  secret: 'vip-bot-secret-1337',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

app.use(express.json());

// Auth API
app.get("/api/auth/url", (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = `${process.env.APP_URL}/auth/callback`;
  
  if (!clientId) {
    return res.status(500).json({ error: "Missing DISCORD_CLIENT_ID" });
  }

  const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20email%20guilds.join`;
  res.json({ url });
});

app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = `${process.env.APP_URL}/auth/callback`;

  if (!code || !clientId || !clientSecret) {
    return res.send("Auth failed: Missing parameters");
  }

  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code: code.toString(),
        redirect_uri: redirectUri,
      }),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const tokens = await tokenResponse.json();
    
    // Fetch User Data
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userData = await userRes.json();

    // Store in session
    (req.session as any).user = userData;

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authenticating... This window will close.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Callback error", error);
    res.status(500).send("Auth error");
  }
});

app.get("/api/user", (req, res) => {
  res.json((req.session as any).user || null);
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Server-side robust streaming AI Chat API
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages configuration" });
  }

  try {
    const client = getGeminiClient();
    
    // Set headers for SSE/chunked transmission
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    // Convert client-sent messages to the standard format required by generateContentStream
    const formattedContents = messages.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    const responseStream = await client.models.generateContentStream({
      model: model,
      contents: formattedContents,
      config: {
        systemInstruction: "You are 'VIP AI CHAT', the Ultimate Tech Oracle and Business Strategist. You are an elite expert in Full-Stack Web Development, Mobile App Architecture, and Discord Bot Automation. Your personality is professional, authoritative, and helpful. You provide complete, production-ready code blocks and explain complex concepts simply. You can speak in Hindi, Hinglish, and English. You are the 'Master' of technology.",
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }
    res.end();
  } catch (error: any) {
    console.error("Server API Chat Streaming error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error?.message || "Failed to generate AI response" });
    } else {
      res.end();
    }
  }
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
