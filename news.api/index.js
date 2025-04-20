const WebSocket = require("ws");
const LoremIpsum = require("lorem-ipsum").LoremIpsum;
const ulid = require("ulid").ulid;

const PORT = process.env.PORT || 8080;
const MAX_CLIENTS = 100; // Maximum number of concurrent clients

const lorem = new LoremIpsum();
const clients = new Set();

const wss = new WebSocket.Server({ port: PORT });

// Handle server shutdown
process.on("SIGINT", () => {
  console.log("Shutting down server...");
  wss.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

wss.on("connection", function connection(ws) {
  // Check if we've reached the maximum number of clients
  if (clients.size >= MAX_CLIENTS) {
    ws.send("Server is at maximum capacity");
    ws.close();
    return;
  }

  console.log("New client connected");

  // Initialize state
  let state = "initial";
  let pingInterval;

  const onMessage = {
    initial: (message) => {
      if (typeof message !== "string" || message.trim() !== "hello") {
        ws.send("Invalid handshake");
        ws.close();
        return;
      }
      state = "ready";
      ws.send("Welcome to the WebSocket server!");
      clients.add(ws);
    },
    ready: (message) => {
      if (typeof message !== "string") {
        console.error("Invalid message type:", typeof message);
        return;
      }
      switch (message.trim()) {
        case "close":
          ws.close();
          break;
        default:
          console.log("Received message:", message);
      }
    },
  };

  ws.on("message", (message) => {
    try {
      const handler = onMessage[state];
      if (handler) {
        handler(message.toString());
      } else {
        console.error("Invalid state:", state);
        ws.close();
      }
    } catch (error) {
      console.error("Error handling message:", error);
      ws.close();
    }
  });

  // Set a ping interval to detect dead connections
  pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(pingInterval);
      clients.delete(ws);
    }
  }, 30000);

  ws.on("close", () => {
    console.log("Client disconnected");
    clearInterval(pingInterval);
    clients.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    clearInterval(pingInterval);
    clients.delete(ws);
  });
});

const HEADLINE_PATTERNS = [
  // Pattern 1: Subject + Action + Object
  (s, a, o) =>
    `${s} ${a} ${o} ${lorem.generateWords(Math.floor(Math.random() * 7) + 1)}`,
  // Pattern 2: Subject + "to" + Action + Object
  (s, a, o) =>
    `${s} to ${a} ${o} ${lorem.generateWords(
      Math.floor(Math.random() * 7) + 1
    )}`,
  // Pattern 3: Object + "as" + Subject + Action
  (o, s, a) =>
    `${o} as ${s} ${a} ${lorem.generateWords(
      Math.floor(Math.random() * 7) + 1
    )}`,
  // Pattern 4: Subject + "could" + Action + Object
  (s, a, o) =>
    `${s} could ${a} ${o} ${lorem.generateWords(
      Math.floor(Math.random() * 7) + 1
    )}`,
  // Pattern 5: Subject + "may" + Action + Object
  (s, a, o) =>
    `${s} may ${a} ${o} ${lorem.generateWords(
      Math.floor(Math.random() * 7) + 1
    )}`,
  // Pattern 6: Subject + "seen" + Action + Object
  (s, a, o) =>
    `${s} seen ${a} ${o} ${lorem.generateWords(
      Math.floor(Math.random() * 7) + 1
    )}`,
  // Pattern 7: Subject + "facing" + Object
  (s, _, o) =>
    `${s} facing ${o} ${lorem.generateWords(
      Math.floor(Math.random() * 7) + 1
    )}`,
  // Pattern 8: Subject + "amid" + Object
  (s, _, o) =>
    `${s} amid ${o} ${lorem.generateWords(Math.floor(Math.random() * 7) + 1)}`,
  // Pattern 9: Subject + "after" + Object
  (s, _, o) =>
    `${s} after ${o} ${lorem.generateWords(Math.floor(Math.random() * 7) + 1)}`,
  // Pattern 10: Subject + "despite" + Object
  (s, _, o) =>
    `${s} despite ${o} ${lorem.generateWords(
      Math.floor(Math.random() * 7) + 1
    )}`,
];

function generateRandomHeadlines() {
  try {
    const sources = [
      "Bloomberg",
      "Reuters",
      "Dow Jones",
      "AP",
      "People's Daily",
      "Twitter",
      "Truth Social",
      "CNBC",
      "SEC",
      "WSJ",
      "FT",
    ];
    const subjects = [
      "US",
      "China",
      "Japan",
      "Europe",
      "EU",
      "Russia",
      "India",
      "White House",
      "Trump",
      "Apple",
      "Binance",
      "Musk",
      "Putin",
      "Germany",
      "France",
      "Mexico",
      "Canada",
    ];
    const actions = [
      "warns",
      "says",
      "announces",
      "expects",
      "believes",
      "blasts",
    ];
    const objects = [
      "inflation",
      "recession",
      "trade war",
      "COVID-19",
      "economic recovery",
      ...subjects,
    ];
    const assets = ["BTC", "XRP", "ETH", "SOL", "DOGE", "BNB"];

    const numSources = Math.floor(Math.random() * sources.length) + 1;
    const srcs = [];
    for (let i = 0; i < numSources; i++) {
      srcs.push(sources[Math.floor(Math.random() * sources.length)]);
    }

    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const object = objects[Math.floor(Math.random() * objects.length)];

    // 10% chance for high priority
    const highPriority = Math.random() < 0.1;

    // Add asset mention with 40% probability
    const asset =
      Math.random() < 0.4
        ? assets[Math.floor(Math.random() * assets.length)]
        : null;

    // Add link with 50% probability
    const link =
      Math.random() < 0.5
        ? `https://${lorem
            .generateWords(Math.floor(Math.random() * 2) + 1)
            .split(" ")
            .join("-")}.com/${ulid()}`
        : null;

    const headlines = srcs.map((src) => {
      const pattern =
        HEADLINE_PATTERNS[Math.floor(Math.random() * HEADLINE_PATTERNS.length)];

      // Add some random adjectives and adverbs
      const adjectives = [
        "Major",
        "Significant",
        "Unexpected",
        "Surprising",
        "Dramatic",
        "Sudden",
        "Gradual",
      ];
      const adverbs = [
        "quickly",
        "slowly",
        "suddenly",
        "gradually",
        "significantly",
        "dramatically",
      ];

      let headline = pattern(subject, action, object);

      // 30% chance to add an adjective
      if (Math.random() < 0.3) {
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        headline = `${adj} ${headline}`;
      }

      // 20% chance to add an adverb
      if (Math.random() < 0.2) {
        const adv = adverbs[Math.floor(Math.random() * adverbs.length)];
        headline = `${headline} ${adv}`;
      }

      const item = {
        id: ulid(),
        source: src,
        headline: headline,
        assets: asset ? [asset] : [],
        link: link,
        keywords: [subject, object],
      };
      if (highPriority) {
        item.priority = "high";
      }
      return item;
    });

    return headlines;
  } catch (error) {
    console.error("Error generating headline:", error);
    return null;
  }
}

console.log(`WebSocket server is running on ws://localhost:${PORT}`);

setInterval(async () => {
  try {
    const shouldGenerate = Math.random() < 0.2;
    if (shouldGenerate) {
      const headlines = generateRandomHeadlines();
      if (!headlines) {
        console.error("Failed to generate headlines");
        return;
      }

      for (const headline of headlines) {
        if (!headline) continue;
        console.debug("Sending headline:", headline);

        const deadClients = new Set();

        try {
          const message = JSON.stringify({
            ...headline,
            timestamp: new Date().valueOf(),
          });
          clients.forEach((client) => {
            try {
              if (client.readyState === WebSocket.OPEN) {
                client.send(message);
              } else {
                deadClients.add(client);
              }
            } catch (error) {
              console.error("Error sending headline:", error);
              deadClients.add(client);
            }
          });

          // Clean up dead clients
          deadClients.forEach((client) => clients.delete(client));

          // wait for a random amount of time between headlines
          await new Promise((resolve) =>
            setTimeout(resolve, Math.random() * 100)
          );
        } catch (error) {
          console.error("Error processing headline:", error);
        }
      }
    }
  } catch (error) {
    console.error("Error in headline generation interval:", error);
  }
}, 500);
