# ScholarHunter - AI-Powered Scholarship Ecosystem

ScholarHunter is a comprehensive, intelligent platform designed to streamline the scholarship discovery and application process for students worldwide. Powered by Google's latest **Gemini 2.0 Flash** AI, the platform provides personalized matching, expert academic consultation through a multimodal chat interface, and automated document generation.

## 🚀 Key Features

- **Expert AI Consultant (ScholarBot)**: A high-level academic advisor capable of analyzing complex scholarship queries, providing detailed funding breakdowns, and offering strategic advice.
- **Multimodal Chat**: Upload images, PDFs, and documents directly into the chat. ScholarBot can analyze your CV, flyers, or academic transcripts in real-time.
- **Dynamic Scholarship Matching**: Real-time matching engine that aligns your academic profile with global opportunities (Fulbright, Chevening, Erasmus Mundus, etc.).
- **Live Discovery UI**: Watch the AI agent scour databases in real-time with a live progress tracker and instant WebSocket notifications for new matches.
- **Document Generation**: Automated generation of Personal Statements, Statements of Purpose, and Cover Letters tailored to specific scholarships.
- **Interview Preparation**: AI-driven mock interviews with personalized feedback on your answers.

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Real-time**: Socket.io Client
- **Components**: Radix UI / Shadcn

### Core API (Backend)
- **Framework**: NestJS
- **Databases**: 
  - PostgreSQL (via Prisma) for relational data
  - MongoDB for flexible scholarship data
- **Cache**: Redis
- **Real-time**: Socket.io (WebSockets)

### LLM Service
- **Framework**: FastAPI (Python)
- **AI Model**: Google Gemini 2.0 Flash
- **Multimodal**: Support for Image/PDF processing

---

## ⚡ Quick Start (Docker Compose)

The easiest way to run the entire ecosystem is using Docker Compose.

### Prerequisites
- [Docker](https://www.docker.com/get-started) and Docker Compose installed.
- A **Google Gemini API Key** (Get one at [aistudio.google.com](https://aistudio.google.com/)).

### Setup Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/folexy13/scholarhunter.git
   cd scholarhunter
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory (use `.env.example` as a template):
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file and add your `GEMINI_API_KEY`.

3. **Start the ecosystem**:
   ```bash
   docker-compose up -d --build
   ```

4. **Access the application**:
   - **Frontend**: [http://localhost:3001](http://localhost:3001)
   - **Core API**: [http://localhost:3000](http://localhost:3000)
   - **LLM Service**: [http://localhost:8000](http://localhost:8000)

---

## 🔧 Local Development Setup

If you prefer to run services individually for development:

### 1. Core API (NestJS)
```bash
cd core-api
npm install
# Set up your .env file
npx prisma generate
npx prisma db push
npm run start:dev
```

### 2. LLM Service (FastAPI)
```bash
cd llm-service
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
# Set up your .env file
python main.py
```

### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

---

## 📝 Environment Configuration

Key variables in your root `.env` file:

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Your Google AI Studio API Key |
| `GEMINI_MODEL` | Set to `gemini-2.0-flash` |
| `CORE_API_SECRET` | Shared secret for inter-service communication |
| `POSTGRES_PASSWORD` | Password for the PostgreSQL database |
| `MONGO_PASSWORD` | Password for the MongoDB database |

---

## 👤 Author

**Folajimi Aluko**
- GitHub: [@folexy13](https://github.com/folexy13)
- Project: [ScholarHunter](https://github.com/folexy13/scholarhunter)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
