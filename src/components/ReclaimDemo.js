import { useState } from "react";
import QRCode from "react-qr-code";
import { ReclaimProofRequest } from "@reclaimprotocol/js-sdk";
import React from "react";

function ReclaimDemo() {
  const [requestUrl, setRequestUrl] = useState("");
  const [proofs, setProofs] = useState([]);
  const [error, setError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const getVerificationReq = async () => {
    try {
      setIsVerifying(true);
      setError(null);

      // Your credentials from the Reclaim Developer Portal
      const APP_ID = "0xfCd116AF2F8bD4a6B0A3343C4b65BFaB52B6CBfd";
      const APP_SECRET = "0xd5e91f51bb9a18cf1c4d1ed08018d2042ce23c09391b5f0cc0d1885ecf8634fd";
      const PROVIDER_ID = "c5104d5f-aaa8-43cd-be5f-8315f7b9a0b8";

      // Initialize Reclaim SDK with credentials
      const reclaimProofRequest = await ReclaimProofRequest.init(
        APP_ID,
        APP_SECRET,
        PROVIDER_ID
      );

      // Generate verification request URL
      const url = await reclaimProofRequest.getRequestUrl();
      console.log("Request URL:", url);
      setRequestUrl(url);

      // Start listening for proof submissions
      await reclaimProofRequest.startSession({
        onSuccess: (proofs) => {
          console.log("Verification success:", proofs);
          setProofs(proofs);
          setIsVerifying(false);
        },
        onError: (error) => {
          console.error("Verification failed:", error);
          setError("Verification failed. Please try again.");
          setIsVerifying(false);
        },
      });
    } catch (error) {
      console.error("Error creating verification request:", error);
      setError("An error occurred while starting verification.");
      setIsVerifying(false);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Zero-Knowledge Proof Demo</h1>

      <button onClick={getVerificationReq} disabled={isVerifying}>
        {isVerifying ? "Verifying..." : "Get Verification Request"}
      </button>

      {/* Display QR code if verification link is available */}
      {requestUrl && (
        <div style={{ margin: "20px 0" }}>
          <h3>Scan to Verify:</h3>
          <QRCode value={requestUrl} />
          <p>
            Or click <a href={requestUrl}>here</a> to verify.
          </p>
        </div>
      )}

      {/* Show proof data if verification succeeds */}
      {proofs.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h2>✅ Verification Successful!</h2>
          <pre>{JSON.stringify(proofs, null, 2)}</pre>
        </div>
      )}

      {/* Show error message if verification fails */}
      {error && (
        <div style={{ color: "red", marginTop: "10px" }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export default ReclaimDemo;
