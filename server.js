require('dotenv').config();
const express = require('express');
const { ReclaimProofRequest, verifyProof } = require('@reclaimprotocol/js-sdk');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.text({ type: '*/*', limit: '50mb' })); // Handle proof data

// Temporary storage for verified users (should use a database in production)
const verifiedUsers = new Set();


// Generate Reclaim SDK configuration
app.get('/reclaim/generate-config', async (req, res) => {
  try {
    const APP_ID = '0xd3ce1ea3ECcc4994CE21f61D8C6Fa9eefC6b7628';
    const APP_SECRET = '0x2580f9dafebc09f5e184670301f5d3cf8d5cc86f74ba14186839a24ded3389bf';
    const PROVIDER_ID = 'c5104d5f-aaa8-43cd-be5f-8315f7b9a0b8'; 

    if (!APP_ID || !APP_SECRET || !PROVIDER_ID) {
      return res.status(500).json({ error: 'Missing Reclaim credentials in environment variables' });
    }

    const reclaimProofRequest = await ReclaimProofRequest.init(APP_ID, APP_SECRET, PROVIDER_ID);
    reclaimProofRequest.setAppCallbackUrl('http://localhost:3000/receive-proofs');

    // Generate the correct proof request URL
    const requestUrl = await reclaimProofRequest.getRequestUrl();
    console.log("Generated request URL:", requestUrl); // ✅ Debugging

    return res.json({ reclaimProofRequestConfig: JSON.stringify({ requestUrl }) });
  } catch (error) {
    console.error("Backend error:", error);
    res.status(500).json({ error: "Failed to generate verification request", details: error.message });
  }
});

// Receive and verify proofs
app.post('/receive-proofs', async (req, res) => {
  try {
    console.log("Raw request body:", req.body); // ✅ Debugging log

    let proof;
    if (typeof req.body === "string") {
      // Ensure we are handling URL-encoded JSON
      proof = JSON.parse(decodeURIComponent(req.body));
    } else {
      proof = req.body;
    }

    console.log("Parsed proof:", proof); // ✅ Debugging log

    // Verify the proof using Reclaim SDK
    const isValid = await verifyProof(proof);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid proof data' });
    }

    console.log('✅ Verified proof:', proof);

    // Extract user identifier (modify based on provider)
    const userId = proof.claims?.[0]?.value;

    if (!userId) {
      return res.status(400).json({ error: 'User ID not found in proof' });
    }

    // Store user as verified (use a database in production)
    verifiedUsers.add(userId);

    return res.status(200).json({ message: 'User verified successfully', userId });
  } catch (error) {
    console.error("❌ Error processing proofs:", error);
    return res.status(500).json({ error: 'Failed to process proof', details: error.message });
  }
});

// Check verification status
app.get('/check-verification', (req, res) => {
  // Simulate checking if any user has been verified
  const isVerified = verifiedUsers.size > 0;
  return res.json({ verified: isVerified });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
