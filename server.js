require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(bodyParser.json());

// Environment Variables
const PORT = process.env.PORT || 3000;
const DIAL_API_KEY = process.env.DIAL_API_KEY;

if (!DIAL_API_KEY) {
  console.error("Missing DIAL_API_KEY in environment variables.");
  process.exit(1);
}

// Handlers
app.post('/webhook', (req, res) => {
  const { sender, message } = req.body;

  if (!sender || !message) {
    return res.status(400).send("Invalid payload: 'sender' and 'message' are required.");
  }

  console.log(`Received message from ${sender}: ${message}`);

  // TODO: Add routing logic here based on message content and business rules
  res.status(200).send("Webhook received.");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Webhook endpoint: POST /webhook');
});