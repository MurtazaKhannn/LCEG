# LCEG — LeetCode Example Generator

A Chrome extension that helps you understand LeetCode problems with clearer examples, instant practice inputs, and AI-powered walkthroughs.

## Features

- **Original examples** — Parses LeetCode's built-in examples (shown in the side panel; page stays stock)
- **Generated inputs** — Instant rule-based practice inputs (simple, medium, edge) with zero API calls
- **AI examples** — Gemini-generated examples with input, output, and step-by-step walkthroughs
- **Side panel** — Full view with multiple examples, compare mode, copy buttons, and "Explain more"
- **Tree visualization** — ASCII tree diagrams for tree problems

## Installation (Development)

1. Clone and install dependencies:

```bash
cd lceg
npm install
npm run dev
```

2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `dist/` folder
5. Navigate to any [LeetCode problem](https://leetcode.com/problems/two-sum/)

## Gemini API Key Setup (Free)

AI examples require a free Gemini API key:

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **Create API key** (no credit card required)
4. Open the extension **Settings** (link in side panel footer, or right-click extension icon → Options)
5. Paste your API key and click **Save**
6. Click **Test Connection** to verify

Recommended model: `gemini-2.5-flash` (best free-tier balance).

## Usage

1. Open any LeetCode problem page (the page UI is unchanged)
2. Click the extension icon to open the **side panel**
3. Review original examples and generated practice inputs
4. Click **Generate AI Examples** (requires API key)
5. Use **Explain more** on any AI example for a deeper walkthrough
6. Switch LeetCode problem tabs — the side panel refreshes automatically

## Project Structure

```
src/
├── background/     # Service worker — GraphQL, AI, caching, badge
├── sidepanel/      # Main UI (all examples)
├── options/        # Settings page (API key)
└── lib/
    ├── graphql.ts  # LeetCode API client
    ├── generators/ # Rule-based example generator
    ├── ai/         # Gemini client + prompts
    └── viz/        # Tree ASCII visualization
```

## Development

```bash
npm run dev    # Start dev server with HMR
npm run build  # Production build to dist/
```

After code changes, reload the extension in `chrome://extensions`.

## Known Limitations

- **Premium problems** may require you to be logged in to LeetCode
- **AI examples** are illustrative — always verify outputs against the problem logic
- **Gemini rate limits** apply on the free tier (~15 requests/minute); results are cached for 7 days per problem

## License

Private — for personal use.
# LCEG
