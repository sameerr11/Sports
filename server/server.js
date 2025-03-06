const express = require("express");
const connectDB = require("./db");

const app = express();

// Connect to MongoDB
connectDB();

app.get("/", (req, res) => {
  res.send("MongoDB Atlas Connected!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
