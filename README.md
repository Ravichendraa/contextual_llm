# 📚 Contextual LLM Assistant

A full-stack AI-powered application that allows users to **upload academic documents**, provide them with a **context name**, and then **ask questions** about the content. The backend processes documents using **Google Gemini's embedding model**, stores them in **Pinecone vector database**, and responds to queries using **semantic search** and **Gemini-Flash** for response generation.
---
# 🌐 [Live Website](https://contextual-llm.vercel.app/)

## 🚀 Features

- Upload multiple files (`.pdf`, `.docx`, `.doc`, `.txt`)
- Create a context (e.g., “DS-Sem3”) for uploaded files
- Ask natural language questions based on uploaded documents
- Semantic search powered by Google Gemini Embeddings + Pinecone
- Answer generation using Gemini 1.5 Flash model

---

## 🧠 Tech Stack

### Frontend
- **React** with **Vite**
- **Tailwind CSS** for UI
- **Lucide Icons**
- **Axios** for API calls

### Backend
- **Node.js** with **Express**
- **Google Generative AI SDK** (`@google/generative-ai`)
- **Pinecone** Vector DB for semantic document storage
- **pdf-parse**, **mammoth**, and native handling for text extraction
- **express-fileupload**, **dotenv**, **cors**

---

## 🖼️ Workflow Overview

### 1. Uploading Files
- Users select and upload files.
- Files are parsed and split into chunks (max 1000 characters).
- Each chunk is converted into an **embedding** using `models/embedding-001` from Gemini.
- Embeddings are **padded to 1024 dimensions** and stored in Pinecone with metadata including the context name.

### 2. Asking Questions
- User inputs a question.
- The question is embedded and queried against Pinecone for top K relevant chunks (based on similarity).
- These results are concatenated to form a context.
- A prompt is generated and passed to **Gemini 1.5 Flash**.
- The response is returned and shown in the chat-style UI.

---

## 📂 Project Structure

```
client/
  └── App.jsx         # Frontend interface
server/
  └── index.js        # API server and AI logic
.env                  # API keys and environment variables
README.md
```

---

## 🔧 Setup Instructions

### 1. Clone the Repo

```bash
git clone https://github.com/Ravichendraa/contextual_llm.git
cd contextual_llm
```

### 2. Install Frontend

```bash
cd client
npm install
npm run dev
```

### 3. Install Backend

```bash
cd ../server
npm install
```

### 4. Configure `.env`

Create a `.env` file in `/server` with:

```
GEMINI_API_KEY=your_google_generative_ai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=your_index_name
```

### 5. Run Backend

```bash
node index.js
```

---

## 📦 API Endpoints

- `POST /upload`
  - `files` - FormData with files
  - `contextName` - Unique identifier for your document group

- `POST /ask`
  - `contextName` - Same as used during upload
  - `question` - Natural language query

---

## ✨ Sample Use Case

1. Upload course syllabus and notes under context name `"ML-Sem4"`
2. Ask: `"What are the main algorithms covered in this syllabus?"`
3. Get precise, AI-generated answers from Gemini using your own documents as context.

---

## 📢 Credits

Built with 💙 using **Google Generative AI**, **Pinecone**, and **React**.
