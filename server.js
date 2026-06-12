require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const winston = require('winston');
const app = express();

// Middleware
app.use(bodyParser.json());

// Environment Variables
const PORT = process.env.PORT || 3000;
const DIAL_API_KEY = process.env.DIAL_API_KEY;
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://api.dial.com/whatsapp';

if (!DIAL_API_KEY) {
  console.error("Missing DIAL_API_KEY in environment variables.");
  process.exit(1);
}

// Logger Configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/server.log' })
  ]
});

// Decision Engine (Placeholder)
const decisionEngine = (message) => {
  if (message.toLowerCase().includes('help')) {
    return 'Our support team will reach out to you shortly.';
  } else if (message.toLowerCase().includes('status')) {
    return 'Your request is being processed. Please hold on.';
  } else {
    return "I'm sorry, I didn't understand that. Can you provide more details?";
  }
};

// Handlers
app.post('/webhook', (req, res) => {
  const { sender, message } = req.body;

  if (!sender || !message) {
    logger.error("Invalid payload: 'sender' and 'message' are required.");
    return res.status(400).send("Invalid payload: 'sender' and 'message' are required.");
  }

  logger.info(`Received message from ${sender}: ${message}`);

  const responseMessage = decisionEngine(message);
  
  // Send Outgoing Message
  axios.post(WHATSAPP_API_URL, {
    to: sender,
    message: responseMessage,
  }, {
    headers: {
      Authorization: `Bearer ${DIAL_API_KEY}`,
    }}).then(() => {
    logger.info(`Response sent to ${sender}: ${responseMessage}`);
    res.status(200).send("Webhook processed successfully.");
  }).catch((error) => {
    logger.error(`Failed to send response to ${sender}: ${error.message}`);
    res.status(500).send("Failed to process webhook.");
  });
});

// Start Server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info('Webhook endpoint: POST /webhook');
});