const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

// Initialize the Express app
const app = express();
app.use(express.json());

// Your Private Key
const PALMPAY_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAKeOHf+bXqC1sYnWHp9cYwnCspd5
uV95W3BZLWUPVFInprIB5K4LXKD4FHiEcaX7HmwwizgJkTofTMfoPFNNqRGubg3VwjfaQR6w9PEV
GO9NP/opXYkxDjRkm3nuQXc1rhzLJvwxT4IwMq/E1dxwTd3zZkIP94omyF6fYd7vee65AgMBAAEC
gYBciQ5kNghitTWhrBEpbbp8j3xWT7Fi2wD24SlC4N5uqNtU/9qtjDTR6XBUxsCFLFS253BbuFzu
Po8G8GkwkHlIF5Znsqtw2Beviv5Md2cTfCkFxhQYRGs4jhtdUltPo/P5G0CRKcO6C4UBP9FnY+UD
1UZ9RsKU2Sqz4PtN15pTyQJBANgpX4JxYg2hgG93RXkModoJXwe9teoUM3mYawmlpT8prE32Hsqe
9Wz17y9ySDjuIgKZHcVe9LHn0VOUdJvc+HMCQQDGb3anQ6BRDfWhfJldBEolMc+a7VfHdD8Q7Hw3
FueKcdgV6c59KU0nSNPYNcQFRBhE+1pR+zLDAjZFrtcL2W0jAkB1d1Y9rpvYSHFhIXGRbHnv4LPR
oxheUgf/BgL0xR1di6nk2+Czv1ojkioeoH364f19Z/Ozs/xJSW6Jet07bgNdAkEApxXN0/NmdzmI
3Uv8Gs103TK++1Xj9qcUP1zRDtXzaqiHaZQwcUUomO6CqmhDQKfgw5zdpXAdgwRGzI/2tRyD/wJA
D7x7Xxbt2pBy6OhHfYEq7XGRKJlit8IHnVRDOK8F7IJN3yRlDV4O91IKIOlIxbp/jF1V+8F1Gk0f
2tQyw5cn4g==
-----END PRIVATE KEY-----`;

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// PalmPay Create Order Route (Server-to-Server)
app.post('/api/v1/create-palmpay-order', async (req, res) => {
  const endpoint = "https://open-gw-prod.palmpay-inc.com/api/v2/payment/merchant/createorder";
  const appId = "L240828084816474951185";
  
  const orderAmount = req.body.amount || 250000;
  const requestTime = Date.now();
  const orderId = `TXN_${requestTime}`;
  const nonceStr = crypto.randomBytes(16).toString('hex');

  const payload = {
    amount: orderAmount,
    appId: appId,
    callBackUrl: "https://palmpay-listener.onrender.com/health",
    currency: "NGN",
    description: req.body.description || "Direct Charge Transfer",
    goodsDetails: JSON.stringify([{ goodsId: "1" }]),
    nonceStr: nonceStr,
    notifyUrl: "https://palmpay-listener.onrender.com/api/v1/transfer/receive",
    orderId: orderId,
    productType: "pay_direct",
    requestTime: requestTime,
    title: req.body.title || "Direct Payment",
    version: "V1.1"
  };

  const sortedKeys = Object.keys(payload).sort();
  const signString = sortedKeys
    .filter(k => payload[k] !== null && payload[k] !== "")
    .map(k => `${k}=${payload[k]}`)
    .join("&");

  try {
    const signature = crypto.sign("sha256", Buffer.from(signString), {
      key: PALMPAY_PRIVATE_KEY,
      padding: crypto.constants.RSA_PKCS1_PADDING
    }).toString("base64");

    const response = await axios.post(endpoint, payload, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "CountryCode": "NG",
        "Authorization": `Bearer ${appId}`,
        "appId": appId,
        "Signature": signature
      }
    });
    
    res.json(response.data);
  } catch (error) {
    const errorDetails = error.response ? error.response.data : error.message;
    res.status(500).json({ error: errorDetails });
  }
});

// PalmPay Webhook Callback Endpoint
app.post('/api/v1/transfer/receive', (req, res) => {
  console.log('--- Incoming PalmPay Webhook Payload ---');
  console.log(JSON.stringify(req.body, null, 2));

  res.status(200).json({
    respCode: "0000",
    respMsg: "SUCCESS"
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PalmPay listener running on port ${PORT}`);
});
