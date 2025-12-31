# AI Memory Assistant — Project Vision (Mobile-First)

This project is a personal AI memory assistant designed for a mobile-first experience.

## Core Idea

People regularly encounter moments where they need to remember something important later.  
This app exists to capture those moments quickly and make them reliably retrievable in the future.

This product is not a chatbot.  
It is not an autonomous AI agent.  
It is not a productivity or task-automation tool.

It is a memory system.

---

## Long-Term Product Vision

The product will be an iPhone-first application that:

- Feels immediate, calm, and trustworthy
- Allows memory capture in one or two interactions (tap or press-and-hold)
- Uses voice as the primary input method (speech → memory)
- Functions as a quiet extension of the user’s own memory

The experience should feel:

- Fast
- Simple
- Clean
- Private
- Intentionally minimal

Users should be able to naturally ask questions such as:

- “What insurance do we have?”
- “When is my father’s birthday?”
- “What year did I run the Boston Marathon?”
- “What recipe do I use for vanilla cupcakes?”
- “Tell me about Winston and Rose.”

All answers must be derived exclusively from the user’s stored memory.

---

## Core Principles (Non-Negotiable)

### 1. Memory-Only Truth
The assistant must answer **only** using explicitly stored memory.  
If the information does not exist, the assistant must respond:  
“I don’t know.”

### 2. No Inference or Guessing
The system must never infer, assume, approximate, extrapolate, or invent information.  
No hallucination is acceptable.

### 3. Calm by Default
The assistant should not provide suggestions, coaching, or unsolicited help.  
It responds only to direct queries.

### 4. User-Owned Memory
All stored memory belongs entirely to the user.  
No external or general knowledge is blended into responses.

### 5. Simple First, Expand Deliberately
Initial scope includes:
- Facts
- References

Additional memory types may be introduced only if they align with the memory-first philosophy.

---

## Technical Direction (Current)

The application is built using:

- Expo
- React Native
- JavaScript / JSX
- OpenAI JavaScript SDK
- `gpt-4o-mini` for AI processing

The system should prioritize clarity, simplicity, and maintainability over architectural complexity.

---

## Current Scope (MVP)

At present, the product is:

- A simple mobile interface for storing and querying memory
- Backed by a minimal and explicit memory store
- Governed by strict behavioral rules enforced at the prompt and application level

The following are explicitly out of scope for now:

- Journaling
- Task automation
- Calendar integration
- Email handling
- Autonomous AI agents

These may be considered later only if they align with the core vision.

---

## UX Philosophy

The interface should feel:

- Quiet
- Minimal
- Obvious
- Nearly invisible

The ideal user reaction is:  
“Why doesn’t my phone already do this?”

---

## Development Philosophy

Move deliberately.  
Prefer correctness over features.  
Favor reliability over cleverness.

If something feels rushed, overly complex, or magical, it is likely misaligned with the product’s intent.
