import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
      // Handle streaming if requested
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
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
}
