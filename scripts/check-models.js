
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No GEMINI_API_KEY found in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // There isn't a direct listModels on genAI instance in some versions, 
        // but usually it's accessed differently or we just test a model.
        // Actually, checking the docs or source would be good. 
        // But standard practice: ModelService on the generated client?
        // The google-generative-ai SDK actually simplifies this. 
        // If listModels isn't directly exposed easily in this node SDK version,
        // we might just try to run a prompt with 'gemini-1.5-flash' and see if it works.

        console.log("Testing gemini-1.5-flash...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent("Hello");
            console.log("gemini-1.5-flash: SUCCESSS", result.response.text());
        } catch (e) {
            console.error("gemini-1.5-flash: FAILED", e.message);
        }

        console.log("Testing gemini-1.5-pro...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
            const result = await model.generateContent("Hello");
            console.log("gemini-1.5-pro: SUCCESS", result.response.text());
        } catch (e) {
            console.error("gemini-1.5-pro: FAILED", e.message);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
