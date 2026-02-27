// =====================================================================
// Email Scheduler — Production Express API
// =====================================================================
// POST /api/send-email        →  instant send
// POST /api/schedule-emails   →  batch schedule (setTimeout-based)
// GET  /api/scheduled-emails  →  list all scheduled entries
// GET  /api/stats             →  dashboard analytics
// GET  /api/health            →  health-check
// =====================================================================

import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:4173",
].filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // allow server-to-server (no origin) and same-origin requests
      if (!origin) return cb(null, true);
      // allow listed origins
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // allow Railway domains automatically
      if (origin.endsWith(".up.railway.app")) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
  })
);
app.use(express.json({ limit: "16kb" }));

// ── Simple rate limiter (per IP, 30 requests / minute) ──────
const rateMap = new Map();
const RATE_WINDOW = 60_000;
const RATE_LIMIT = 30;

function rateLimiter(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress;
  const now = Date.now();
  let bucket = rateMap.get(ip);
  if (!bucket || now - bucket.start > RATE_WINDOW) {
    bucket = { start: now, count: 0 };
    rateMap.set(ip, bucket);
  }
  bucket.count++;
  if (bucket.count > RATE_LIMIT) {
    return res.status(429).json({ success: false, error: "Too many requests. Please try again later." });
  }
  next();
}
app.use("/api", rateLimiter);

// ── Serve static React build in production ──────────────────
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));

// ── In-Memory Store ─────────────────────────────────────────
const scheduledEmails = new Map();
let nextId = 1;

const stats = {
  totalSent: 0,
  totalScheduled: 0,
  sentToday: 0,
  lastResetDate: new Date().toDateString(),
  users: new Set(),
};

function resetDailyStatsIfNeeded() {
  const today = new Date().toDateString();
  if (stats.lastResetDate !== today) {
    stats.sentToday = 0;
    stats.lastResetDate = today;
  }
}

// ── Nodemailer Transporter ──────────────────────────────────
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "465"),
  secure: process.env.EMAIL_SECURE !== "false",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter
  .verify()
  .then(() => console.log("[SMTP] Connection verified"))
  .catch((err) => console.error("[SMTP] Connection failed:", err.message));

// ── Groq AI Content Generator ────────────────────────────────
// Uses Groq's free cloud API for llama3. Set GROQ_API_KEY env variable.
// Falls back to a simple template if no API key is set.

async function generateEmailContent(senderName, recipientName, topic) {
  const systemPrompt = "You are a professional email writer. Write concise, well-structured emails with no emojis, no template variables, and no placeholders. Output only the email body text.";
  const userPrompt = `Write a professional email about: ${topic}. From ${senderName} to ${recipientName}. Include a greeting, clear body paragraphs, and a sign-off with the sender name.`;

  // Try Groq (free cloud API — https://console.groq.com)
  if (process.env.GROQ_API_KEY) {
    try {
      console.log("[AI] Generating via Groq...");
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "llama3-8b-8192",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 512,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          console.log("[AI] Groq body generated");
          return text;
        }
      }
      console.warn("[AI] Groq returned non-OK:", res.status);
    } catch (err) {
      console.warn("[AI] Groq unavailable:", err.message);
    }
  } else {
    console.warn("[AI] No GROQ_API_KEY set — using fallback template");
  }

  // Fallback template
  console.log("[AI] Using fallback template");
  return `Dear ${recipientName},\n\nI am writing to you regarding ${topic}.\n\nPlease do not hesitate to reach out if you have any questions or require further information.\n\nBest regards,\n${senderName}`;
}

// ── Email Sending ───────────────────────────────────────────
async function sendEmail(data) {
  const { senderName, senderEmail, recipientName, recipientEmail, topic } = data;

  // Subject is always FULL UPPERCASE, no emojis
  const finalSubject = topic.toUpperCase().replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu, "").trim();

  // Generate complete email body from topic via AI
  const emailBody = await generateEmailContent(senderName, recipientName, topic);

  // Convert newlines to HTML paragraphs
  const htmlBody = emailBody
    .split(/\n\n+/)
    .map((p) => `<p style="color:#374151;line-height:1.7;margin:0 0 14px 0;font-size:15px;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  console.log(`[Email] Sending to ${recipientEmail} | subject: "${finalSubject}"`);

  const info = await transporter.sendMail({
    from: `"${senderName}" <${process.env.EMAIL_USER}>`,
    replyTo: senderEmail,
    to: recipientEmail,
    subject: finalSubject,
    text: emailBody,
    html: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
        <div style="background:#1e293b;padding:28px 32px;">
          <h1 style="color:#ffffff;margin:0;font-size:16px;font-weight:600;letter-spacing:0.5px;">${finalSubject}</h1>
        </div>
        <div style="padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
          ${htmlBody}
        </div>
        <div style="border-top:1px solid #e5e7eb;padding:20px 32px;background:#f8fafc;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
          <p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.5;">This email was generated and delivered using our Email Scheduling Platform.</p>
        </div>
      </div>`,
  });

  resetDailyStatsIfNeeded();
  stats.totalSent++;
  stats.sentToday++;
  stats.users.add(senderEmail);

  console.log(`[Email] Sent to ${recipientEmail} | messageId: ${info.messageId}`);
  return info;
}

// ── Scheduling (setTimeout, non-blocking, one-shot) ─────────
function scheduleEmailJob(emailData, scheduledAt) {
  const target = new Date(scheduledAt).getTime();
  const delay = target - Date.now();

  if (isNaN(target)) throw new Error("Invalid date/time format.");
  if (delay <= 0) throw new Error("Scheduled time must be in the future.");

  const id = nextId++;

  const timerId = setTimeout(async () => {
    const entry = scheduledEmails.get(id);
    try {
      console.log(`[Scheduler] #${id} Firing for ${emailData.recipientEmail}`);
      await sendEmail(emailData);
      if (entry) entry.status = "sent";
      console.log(`[Scheduler] #${id} Completed`);
    } catch (err) {
      if (entry) {
        entry.status = "failed";
        entry.error = err.message;
      }
      console.error(`[Scheduler] #${id} Failed:`, err.message);
    }
  }, delay);

  const entry = {
    id,
    senderName: emailData.senderName,
    senderEmail: emailData.senderEmail,
    recipientName: emailData.recipientName,
    recipientEmail: emailData.recipientEmail,
    topic: emailData.topic,
    scheduledAt: new Date(target).toISOString(),
    timerId,
    status: "scheduled",
    createdAt: new Date().toISOString(),
  };

  scheduledEmails.set(id, entry);
  stats.totalScheduled++;
  stats.users.add(emailData.senderEmail);

  console.log(`[Scheduler] #${id} → ${emailData.recipientEmail} in ${Math.round(delay / 1000)}s`);
  return { id, scheduledAt: entry.scheduledAt, delayMs: delay };
}

// ── Validation ──────────────────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateEmailData(d) {
  const errors = [];
  if (!d.senderName?.trim()) errors.push("Sender name is required.");
  if (!d.senderEmail?.trim() || !isValidEmail(d.senderEmail))
    errors.push("Valid sender email is required.");
  if (!d.recipientName?.trim()) errors.push("Recipient name is required.");
  if (!d.recipientEmail?.trim() || !isValidEmail(d.recipientEmail))
    errors.push("Valid recipient email is required.");
  if (!d.topic?.trim()) errors.push("Topic is required.");
  return errors;
}

// ═════════════════════════════════════════════════════════════
//  API  Routes
// ═════════════════════════════════════════════════════════════

// ── POST /api/send-email — instant send ─────────────────────
app.post("/api/send-email", async (req, res) => {
  console.log("[API] POST /api/send-email");
  const errors = validateEmailData(req.body);
  if (errors.length) {
    console.warn("[API] Validation failed:", errors);
    return res.status(400).json({ success: false, errors });
  }

  try {
    const info = await sendEmail(req.body);
    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error("[API] /send-email error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/schedule-emails — batch schedule ──────────────
app.post("/api/schedule-emails", (req, res) => {
  console.log("[API] POST /api/schedule-emails");
  const { emails } = req.body;

  if (!Array.isArray(emails) || !emails.length) {
    return res.status(400).json({ success: false, error: "No emails provided." });
  }

  const results = [];
  const errors = [];

  for (const item of emails) {
    const validationErrors = validateEmailData(item);
    if (validationErrors.length) {
      errors.push({ recipientEmail: item.recipientEmail, errors: validationErrors });
      continue;
    }
    if (!item.scheduledAt) {
      errors.push({ recipientEmail: item.recipientEmail, errors: ["Scheduled time is required."] });
      continue;
    }
    try {
      const result = scheduleEmailJob(item, item.scheduledAt);
      results.push({ ...result, recipientEmail: item.recipientEmail });
    } catch (err) {
      errors.push({ recipientEmail: item.recipientEmail, errors: [err.message] });
    }
  }

  res.json({
    success: errors.length === 0,
    scheduled: results,
    errors,
  });
});

// ── GET /api/stats ──────────────────────────────────────────
app.get("/api/stats", (_req, res) => {
  resetDailyStatsIfNeeded();
  res.json({
    totalSent: stats.totalSent,
    totalScheduled: stats.totalScheduled,
    sentToday: stats.sentToday,
    totalUsers: stats.users.size,
  });
});

// ── GET /api/scheduled-emails ───────────────────────────────
app.get("/api/scheduled-emails", (_req, res) => {
  const list = [];
  for (const e of scheduledEmails.values()) {
    list.push({
      id: e.id,
      senderName: e.senderName,
      recipientName: e.recipientName,
      recipientEmail: e.recipientEmail,
      topic: e.topic,
      scheduledAt: e.scheduledAt,
      status: e.status,
      error: e.error || null,
    });
  }
  res.json(list);
});

// ── GET /api/health ─────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ── SPA catch-all (serves React app for any non-API route) ──
import fs from "fs";
const indexPath = path.join(clientDist, "index.html");

// Log dist contents on startup for debugging
if (fs.existsSync(clientDist)) {
  const walk = (dir, prefix = "") => {
    try {
      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) walk(full, prefix + f + "/");
        else console.log(`[Static] ${prefix}${f}`);
      }
    } catch {}
  };
  walk(clientDist);
} else {
  console.warn("[Static] client/dist does NOT exist — frontend not built");
}

app.get("*", (_req, res) => {
  // Don't serve index.html for static asset requests
  if (/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|map)$/i.test(_req.path)) {
    return res.status(404).end();
  }
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: "Frontend not built. Run: cd client && npm run build" });
  }
});

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Server] Email Scheduler API running on port ${PORT}`);
  console.log(`[Server] Static files: ${fs.existsSync(clientDist) ? clientDist : "NOT BUILT"}`);
});
