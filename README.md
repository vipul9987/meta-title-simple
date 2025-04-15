# Meta Title Generator

A powerful application to generate SEO-optimized meta titles and descriptions for websites using Google Gemini AI.

## Features

- Generate SEO-optimized meta titles and descriptions
- Multiple variations for each request
- Copy functionality for easy use
- Modern, responsive UI with Tailwind CSS
- Powered by Google Gemini AI
- Fallback generation when AI is unavailable

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   NODE_ENV=production
   ```
4. Start the server:
   ```
   npm start
   ```

## Usage

1. Enter a website URL
2. Enter keywords (comma separated)
3. Select the number of variations you want
4. Click "Generate Meta Content"
5. Copy the generated titles and descriptions

## API Endpoints

- `POST /generate-meta` - Generate meta content
  - Request body: `{ "url": "https://example.com", "keywords": "seo, meta", "variantCount": 3 }`
  - Response: `{ "metaContent": [{ "title": "...", "description": "..." }, ...] }`

- `GET /health` - Health check endpoint

## Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key
- `NODE_ENV` - Environment (development/production)
- `PORT` - Port to run the server on (default: 3000)

## License

MIT
