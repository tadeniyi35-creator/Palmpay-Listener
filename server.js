const express = require('express');
const app = express();

app.use(express.json());

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// PalmPay Webhook Callback Endpoint
app.post('/api/v1/transfer/receive', (req, res) => {
  console.log('--- Incoming PalmPay Webhook Payload ---');
  console.log(JSON.stringify(req.body, null, 2));

  // Respond immediately with PalmPay's expected success structure
  res.status(200).json({
    respCode: "0000",
    respMsg: "SUCCESS"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PalmPay listener running on port ${PORT}`);
});