import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import React from "react";

function ReclaimDemo() {
  const [requestUrl, setRequestUrl] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState(null);

  const getVerificationReq = async () => {
    try {
      setIsVerifying(true);
      setError(null);
  
      // Fetch the proof request config from backend
      const response = await fetch("http://localhost:3000/reclaim/generate-config");
      const data = await response.json();
  
      console.log("Backend response:", data); // ✅ Debugging
  
      if (!data.reclaimProofRequestConfig) {
        throw new Error("Failed to generate verification request.");
      }
  
      // Parse the returned JSON string
      const reclaimProofRequestConfig = JSON.parse(data.reclaimProofRequestConfig);
  
      // Extract the verification URL
      const url = reclaimProofRequestConfig.requestUrl;
      if (!url) {
        throw new Error("No request URL in response");
      }
  
      console.log("Request URL:", url); // ✅ Debugging
      setRequestUrl(url);
    } catch (error) {
      console.error("Error creating verification request:", error);
      setError("An error occurred while starting verification.");
      setIsVerifying(false);
    }
  };

  // Poll the backend to check if the proof is verified
  const pollForVerification = async () => {
    let attempts = 0;
    const maxAttempts = 10;
    const interval = 3000; // Poll every 3 seconds

    const checkProofStatus = async () => {
      try {
        const response = await fetch("http://localhost:3000/check-verification");
        const data = await response.json();

        if (data.verified) {
          setIsVerified(true);
          setIsVerifying(false);
          return;
        }

        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkProofStatus, interval);
        } else {
          setError("Verification timed out. Please try again.");
          setIsVerifying(false);
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
        setError("An error occurred while checking verification.");
        setIsVerifying(false);
      }
    };

    checkProofStatus();
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
            Or click <a href={requestUrl} target="_blank" rel="noopener noreferrer">here</a> to verify.
          </p>
        </div>
      )}

      {/* Show verification success message */}
      {isVerified && (
        <div style={{ marginTop: "20px", color: "green" }}>
          <h2>✅ Verification Successful!</h2>
          <p>You are now verified and can access the site.</p>
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
