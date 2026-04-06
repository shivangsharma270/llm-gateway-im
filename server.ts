import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      env: {
        hasUrl: true,
        nodeEnv: process.env.NODE_ENV
      }
    });
  });

  // Proxy endpoint for LLM Gateway
  app.post("/api/chat", async (req, res) => {
    const { model, messages, temperature, stream, apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: "Missing API Key", 
        details: "Please provide your LLM Gateway API key in the settings." 
      });
    }

    const baseUrl = "https://imllm.intermesh.net";

    console.log(`[Chat Request] Model: ${model}, Messages: ${messages?.length}`);

    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: temperature ?? 1.0,
          stream: stream ?? false,
          stream_options: stream ? { include_usage: true } : undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Gateway Error] Status: ${response.status}, Body: ${errorText}`);
        return res.status(response.status).json({
          error: "Gateway Error",
          status: response.status,
          details: errorText,
        });
      }

      if (stream) {
        // Handle streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
        res.end();
      } else {
        const data = await response.json();
        res.json(data);
      }
    } catch (error) {
      console.error("Proxy Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
