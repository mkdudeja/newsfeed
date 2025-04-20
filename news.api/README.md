# Herm Mock News Server

A WebSocket server that generates and broadcasts random news headlines for the take-home assessment.

## Features

- Generates random news headlines with various patterns
- Supports multiple news sources
- Includes cryptocurrency asset mentions
- Provides unique IDs and timestamps for each headline
- Configurable port via environment variable

## Installation

```bash
npm install
```

## Usage

Start the server:

```bash
npm run server
```

Or with a custom port:

```bash
PORT=3000 npm run server
```

## WebSocket Connection

Connect to the WebSocket server at `ws://localhost:8080` (or your custom port).

### Handshake Protocol

1. Connect to the WebSocket server
2. Send the message `hello` to complete the handshake
3. Start receiving headlines

### Headline Format

Each headline is sent as a JSON object with the following structure:

```json
{
  "id": "unique-ulid",
  "source": "News Source",
  "headline": "The actual headline text",
  "assets": ["BTC"],  // Array of mentioned assets, may be empty
  "link": "https://example.com/unique-id",  // May be null
  "keywords": ["US"],  // Array of keywords from the headline
  "timestamp": 1234567890,  // Unix timestamp in milliseconds
  "priority": "high"  // Only if the item is high priority
}
```

### Example Client Code

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('Connected to server');
  ws.send('hello');  // Complete handshake
};

ws.onmessage = (event) => {
  const headline = JSON.parse(event.data);
  console.log('Received headline:', headline);
};

ws.onclose = () => {
  console.log('Disconnected from server');
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

## Configuration

- `PORT`: Environment variable to set the server port (default: 8080)
- Headline generation rate: Currently set to 20% chance every 500ms
- Asset mention probability: 40%
- Link inclusion probability: 50%

## Dependencies

- ws: WebSocket server implementation
- lorem-ipsum: For generating random text
- ulid: For generating unique IDs

## Development

This server is designed to work with the frontend take-home assessment. See INSTRUCTIONS.md for the complete assessment requirements.
