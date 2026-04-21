const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Import database
const { connectDB } = require("./db");

// Import routes
const authRoutes = require("./routes/auth");
const itemsRoutes = require("./routes/items");

// Import match window cleanup
const { scheduleWindow } = require("./utils/match-window");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware

const allowedOrigins = [
  "https://findly-lostnfound.vercel.app",
  "https://findly-lostnfound-i86o8vq9o-abdullah-a-10s-projects.vercel.app",
  "http://localhost:5173" // Keep for local development
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// Schedule cleanup job
scheduleWindow();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "FINDLY Backend API",
    version: "1.0.0",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

/* Start server*/
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;