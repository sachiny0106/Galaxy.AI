
const apiKey = process.env.GEMINI_API_KEY;

async function check() {
    if (!apiKey) {
        console.error("No API KEY");
        return;
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("Available Models:");
        if (data.models) {
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Error", e);
    }
}
check();
