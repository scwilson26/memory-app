# AI Memory Assistant

A mobile-first personal memory system that helps you capture and retrieve important information using natural language.

## Core Philosophy

This is not a chatbot, an autonomous AI agent, or a productivity tool. It is a **memory system** designed to:

- Store facts and information you want to remember
- Answer questions using only your stored memories
- Never infer, guess, or hallucinate information
- Provide a calm, minimal, trustworthy experience

## Features

- **Natural language memory capture** - Just tell it what to remember
- **Memory-only recall** - Answers questions using only what you've stored
- **Persistent storage** - Your memories are saved locally
- **Edit and delete** - Fix mistakes or remove outdated information
- **Mobile-first design** - Clean, minimal interface optimized for mobile

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key ([get one here](https://platform.openai.com/account/api-keys))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/memory-app.git
cd memory-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your OpenAI API key:
```
EXPO_PUBLIC_OPENAI_API_KEY=your_actual_api_key_here
```

5. Start the development server:
```bash
npm start
```

6. Run on your platform:
   - Press `w` for web
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan the QR code with Expo Go app on your phone

## Usage

### Storing Memories

Simply tell the app what you want to remember:

```
Remember my favorite color is blue
Remember my insurance provider is Acme Insurance
Remember I ran the Boston Marathon in 2019
```

### Recalling Memories

Ask questions naturally:

```
What is my favorite color?
Who is my insurance provider?
When did I run the Boston Marathon?
```

The system will **only** answer using your stored memories. If the information doesn't exist, it will respond: "I don't know."

### Managing Memories

- **Edit**: Click "Edit" on any memory to modify it
- **Delete**: Click "Delete" to remove a memory (with confirmation)
- **View all**: All memories are visible in the list below the input

## Technical Stack

- **Expo** - React Native framework
- **React Native** - Mobile app development
- **AsyncStorage** - Local data persistence
- **OpenAI API** - Natural language processing (gpt-4o-mini)

## Project Structure

```
memory-app/
├── App.js              # Main application component
├── .env               # Environment variables (not committed)
├── .env.example       # Environment variable template
├── package.json       # Dependencies and scripts
└── VISION.md         # Detailed product vision
```

## Core Principles

1. **Memory-Only Truth** - Never infer or guess, only use stored data
2. **No Hallucination** - Strict "I don't know" for missing information
3. **Calm by Default** - No suggestions, coaching, or unsolicited help
4. **User-Owned Memory** - All data belongs to the user
5. **Simple First** - Prefer correctness over features

## Privacy & Security

- All memories are stored locally on your device using AsyncStorage
- Your OpenAI API key is stored in a local `.env` file (not committed to git)
- API calls are made directly from your device to OpenAI
- No data is sent to any third-party servers besides OpenAI

## Roadmap

Future enhancements aligned with the vision:

- Voice input (speech-to-text for memory capture)
- Advanced search and filtering
- Memory export/backup
- iOS native app
- Improved question detection

## Contributing

This is a personal project focused on a specific vision. Please read [VISION.md](VISION.md) to understand the core principles before suggesting changes.

## License

MIT

## Acknowledgments

Built with deliberate focus on simplicity, reliability, and user trust.
