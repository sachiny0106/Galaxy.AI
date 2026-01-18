# Galaxy.AI - LLM Workflow Builder

A pixel-perfect, drag-and-drop workflow builder for LLM applications. Built with Next.js, React Flow, and Google Gemini.

## Features

- **Visual Workflow Builder**: Intuitive drag-and-drop interface using React Flow.
- **Multimodal AI Nodes**:
  - **LLM Node**: Powered by Gemini 2.0 (Text + Vision).
  - **Image/Video Upload**: Integrated with Transloadit for media processing.
  - **Crop & Frame Extraction**: Smart media manipulation nodes.
- **Smart Execution**:
  - **Parallel Processing**: Independent branches run concurrently.
  - **Real-time Status**: Pulsating glow effects and live history tracking.
  - **Retry Mechanism**: Graceful handling of API rate limits.
- **Premium UI**:
  - **Glassmorphism**: Modern, frosted-glass aesthetic.
  - **Dark Mode**: Deep matte black theme with violet accents.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (v4) + Framer Motion
- **State**: Zustand
- **Database**: PostgreSQL + Prisma
- **Auth**: Clerk
- **AI**: Google Gemini API

## Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/sachiny0106/Galaxy.AI.git
   cd Galaxy.AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with your keys (Clerk, Gemini, Database).

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see the builder.

## License

MIT
