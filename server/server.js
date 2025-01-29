/*
|--------------------------------------------------------------------------
| server.js -- The core of your server
|--------------------------------------------------------------------------
|
| This file defines how your server starts up. Think of it as the main() of your server.
| At a high level, this file does the following things:
| - Connect to the database
| - Sets up server middleware (i.e. addons that enable things like json parsing, user login)
| - Hooks up all the backend routes specified in api.js
| - Fowards frontend routes that should be handled by the React router
| - Sets up error handling in case something goes wrong when handling a request
| - Actually starts the webserver
*/

require("dotenv").config();

// Import essential libraries
const http = require("http");
const express = require("express"); // Backend framework
const session = require("express-session"); // Session management
const mongoose = require("mongoose"); // MongoDB connection
const path = require("path"); // Path utilities
const cors = require("cors"); // Enable CORS

// Import internal modules
const validator = require("./validator");
const api = require("./api");
const auth = require("./auth");
const socketManager = require("./server-socket");

// Run setup validator checks
validator.checkSetup();

// Database configuration
const mongoConnectionURL = process.env.MONGO_SRV;
const databaseName = "dreamspace";

// Set mongoose options and connect to MongoDB
mongoose.set("strictQuery", false);
mongoose
  .connect(mongoConnectionURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: databaseName,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error(`❌ Error connecting to MongoDB: ${err}`));

// Create an Express server
const app = express();

// Trust proxy - required for secure cookies on Render
app.set('trust proxy', 1);

// Set up body parsing for handling large payloads (before other middleware)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ Enable CORS before defining any routes
app.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? process.env.CORS_ORIGIN || "https://dreamscape-u5kc.onrender.com"
    : "http://localhost:5173",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ✅ Middleware: Serve static files (e.g., images)
app.use("/images", express.static(path.join(__dirname, "images")));

// ✅ Middleware: Set up session handling
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Ensure SESSION_SECRET is set in .env
    resave: false,
    saveUninitialized: false,
    proxy: true, // Required for Render/Heroku
    cookie: {
      secure: process.env.NODE_ENV === "production", // Only use secure cookies in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Protect against CSRF
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: process.env.NODE_ENV === "production" ? ".render.com" : undefined,
      httpOnly: true
    }
  })
);

// ✅ Middleware: Validate request routes
app.use(validator.checkRoutes);

// ✅ Middleware: Authenticate users
app.use(auth.populateCurrentUser);

// ✅ Connect user-defined API routes
app.use("/api", api);
console.log("✅ API routes successfully loaded.");

// ✅ Serve frontend React build files
const reactPath = path.resolve(__dirname, "..", "client", "dist");
app.use(express.static(reactPath));

// ✅ Catch-all: Serve React frontend for any unknown routes
app.get("*", (req, res) => {
  res.sendFile(path.join(reactPath, "index.html"), (err) => {
    if (err) {
      console.error("❌ Error sending client/dist/index.html:", err.status || 500);
      res.status(err.status || 500).send("Error loading frontend - run `npm run build`?");
    }
  });
});

// ✅ Error Handling Middleware
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status === 500) {
    console.error("❌ Internal Server Error:", err);
  }

  res.status(status).send({
    status,
    message: err.message,
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
const server = http.Server(app);
socketManager.init(server);

server.listen(PORT, () => {
  console.log(`✅ Server running on port: ${PORT}`);
});
