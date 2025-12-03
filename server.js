import express, { json } from "express";
import axios from "axios";
import 'dotenv/config';

const app = express();
app.use(json());

const {
  WEBHOOK_VERIFY_TOKEN,
  PORT,
  BUSINESS_PHONE,
  API_VERSION,
  API_TOKEN,
  Recipient_WA_ID
} = process.env;

async function sendMessage(to, message) {
  try {
    await axios.post(
      
`https://graph.facebook.com/${API_VERSION}/${BUSINESS_PHONE}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message }
      },
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.log("Error:", error.response?.data || error);
  }
}

// Verificación del Webhook
app.get("/webhook", (req, res) => {
  const { "hub.mode": mode, "hub.challenge": challenge, 
"hub.webhook_verify_token": token } = req.query;

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Recepción de mensajes
app.post("/webhook", async (req, res) => {
  const msg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg || msg.type !== "text") return res.sendStatus(200);

  const from = msg.from;
  const text = msg.text.body;

  console.log("Mensaje recibido:", text);

  await sendMessage(from, `${text}`);

  res.sendStatus(200);
});

// Inicia servidor
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
