import { GoogleGenAI } from "@google/genai";

async function main() {

    const ai = new GoogleGenAI({ apiKey: "" });

    const response = await ai.models.embedContent({
        model: 'gemini-embedding-exp-03-07',
        contents: 'What is the meaning of life?',
    });

    console.log(response.embeddings);
}

main();