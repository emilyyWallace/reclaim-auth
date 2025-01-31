const express = require("express");
const crypto = require("crypto"); // Simulating proof creation
const cors = require("cors");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const app = express();
app.use(express.json());
app.use(cors());

// Dummy in-memory database
const users = { "hi@hi.com": { password: "123", proof: null } };
const proofs = {}; // Stores generated proofs

// Simulated login endpoint
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (!users[email] || users[email].password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Generate a proof (simplified for PoC)
    const proof = crypto.createHash("sha256").update(email + Date.now()).digest("hex");
    users[email].proof = proof;
    proofs[proof] = { email, timestamp: Date.now() };
    
    res.json({ message: "Login successful", proof });
});

// Proof verification endpoint
app.post("/verify", (req, res) => {
    const { proof } = req.body;
    if (!proofs[proof]) {
        return res.status(400).json({ message: "Invalid proof" });
    }
    res.json({ message: "Proof verified", data: proofs[proof] });
});

// Airbnb verification endpoint
app.post("/verify-airbnb", async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const browser = await puppeteer.launch({ headless: false, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
        const page = await browser.newPage();
        await page.goto("https://www.airbnb.com/login");
        
        console.log("Typing email...");
        await page.type("input[name='email']", email);
        await page.click("button[type='submit']");
        await page.waitForSelector("input[name='password']", { timeout: 10000 });
        
        console.log("Typing password...");
        await page.type("input[name='password']", password);
        await page.click("button[type='submit']");
        await page.waitForNavigation({ waitUntil: "networkidle2" });
        
        console.log("Checking Airbnb verification status...");
        await page.goto("https://www.airbnb.com/account-verifications");
        
        // Scrape verification status
        const isVerified = await page.evaluate(() => {
            return document.body.innerText.includes("Verified ID");
        });
        
        await browser.close();
        
        if (isVerified) {
            const proof = crypto.createHash("sha256").update(email + "verified").digest("hex");
            proofs[proof] = { email, status: "Verified", timestamp: Date.now() };
            res.json({ message: "User verified on Airbnb", proof });
        } else {
            res.status(403).json({ message: "User does not have a verified Airbnb ID" });
        }
    } catch (error) {
        res.status(500).json({ message: "Airbnb verification failed", error: error.message });
    }
});

// Start the server
const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// Instructions to run this backend
// 1. Install dependencies: npm install express cors puppeteer-extra puppeteer-extra-plugin-stealth
// 2. Save this file as server.js
// 3. Run the server: node server.js
