import express from 'express';
import fileUpload from 'express-fileupload';
import cors from 'cors';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Set up Gemini and Pinecone
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

// Utility: Pad Gemini embeddings to 1024 dimensions
function padEmbedding(embedding, targetLength = 1024) {
  const padded = [...embedding];
  while (padded.length < targetLength) padded.push(0);
  return padded;
}

// Utility: Extract text from uploaded file
const extractText = async (file) => {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'pdf') {
    const data = await pdfParse(file.data);
    return data.text;
  } else if (ext === 'doc' || ext === 'docx') {
    const result = await mammoth.extractRawText({ buffer: file.data });
    return result.value;
  } else if (ext === 'txt') {
    return file.data.toString();
  }
  return '';
};

// --- /upload Endpoint ---
app.post('/upload', async (req, res) => {
  try {
    const contextName = req.body.contextName;
    const files = req.files?.files;

    if (!files) {
      return res.status(400).send({ error: 'No files were uploaded.' });
    }

    const filesArray = Array.isArray(files) ? files : [files];

    for (const file of filesArray) {
      const text = await extractText(file);
      const chunks = text.match(/(.|\s){1,1000}/g);

      if (chunks) {
        const embeddingModel = genAI.getGenerativeModel({ model: "models/embedding-001" });

        const vectors = await Promise.all(
          chunks.map(async (chunk, i) => {
            const response = await embeddingModel.embedContent({
              content: { parts: [{ text: chunk }] },
              taskType: "retrieval_document",
            });

            const paddedEmbedding = padEmbedding(response.embedding.values, 1024);

            return {
              id: `${contextName}-${file.name}-${i}`,
              values: paddedEmbedding,
              metadata: { text: chunk, context: contextName },
            };
          })
        );

        await index.upsert(vectors);
      }
    }

    res.send({ message: 'Context created and data uploaded.' });
  } catch (error) {
    console.error('Error in /upload:', error);
    res.status(500).send({ error: error.message });
  }
});

// --- /ask Endpoint ---
// --- /ask Endpoint ---
app.post('/ask', async (req, res) => {
  try {
    const { question, contextName } = req.body;

    // Step 1: Get Embedding for Question
    const embeddingModel = genAI.getGenerativeModel({ model: "models/embedding-001" });
    const embedResponse = await embeddingModel.embedContent({
      content: { parts: [{ text: question }] }, // Changed this line
      taskType: "retrieval_query",
    });

    const paddedVector = padEmbedding(embedResponse.embedding.values, 1024); // if your Pinecone index is 1024

    // Step 2: Query Pinecone for Top Matches
    const results = await index.query({
      vector: paddedVector,
      topK: 10,
      includeMetadata: true,
      filter: { context: contextName },
    });

    const contextText = results.matches.map(match => match.metadata.text).join("\n");

    // Step 3: Use Gemini to Answer Question
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Based on the following context, answer the question:\n\nContext:\n${contextText}\n\nQuestion:\n${question}`;

    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
    });

    const answer = await result.response.text();
    res.send({ answer });
  } catch (error) {
    console.error('Error in /ask:', error);
    res.status(500).send({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));