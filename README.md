# Sensei AI

Sensei AI is an interactive, intelligent web application designed to help users learn Japanese. It combines an SRS (Spaced Repetition System) for flashcards, comprehensive learning modules for Kana and Kanji, mock JLPT tests, and an integrated AI tutor.

## Features

- **Interactive AI Tutor (Sensei)**: A floating assistant powered by Gemini AI that can answer Japanese questions and analyze screen content to help you understand specific characters or grammar.
- **Spaced Repetition Flashcards (SRS)**: Automatically seeds cards (Vocabulary, Kanji, Grammar) based on your JLPT level and tracks your progress using an SM-2 algorithm.
- **Kanji & Kana Learning**: Explore characters with visual stroke-order animations and voice pronunciation.
- **Mock Tests**: Full JLPT mock exams with persistent progress (saving your state locally across page refreshes) and detailed post-test reports.
- **Personalized Dashboards**: Tracks daily goals, XP, streaks, and overall Japanese mastery.

## Tech Stack

- **Frontend**: Next.js (React), TypeScript, Zustand for state management, CSS modules/Vanilla CSS for styling.
- **Backend**: Node.js, Express, MongoDB with Mongoose, JSON Web Tokens (JWT) for authentication.
- **AI Integration**: Gemini API for intelligent chat and screen analysis.

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB instance (local or Atlas)

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/DesignDread/SENSEI-AI.git
   cd SENSEI-AI
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   # Create a .env file with your MONGO_URI, JWT secrets, and AI API keys
   npm run dev
   ```

3. **Frontend Setup**:
   ```bash
   cd ../web
   npm install
   # Create a .env.local file with NEXT_PUBLIC_API_URL
   npm run dev
   ```

4. **Access the App**:
   Open `http://localhost:3000` in your browser.

## Contributing
Feel free to open issues or submit pull requests for any bugs or feature enhancements!

## License
MIT License
