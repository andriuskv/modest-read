const express = require("express");
const path = require("path");
const cors = require("cors");
const { getSession } = require("./session.js");

const app = express();

app.disable("x-powered-by");
app.use(cors({
  credentials: true,
  origin: ["https://modest-read.herokuapp.com"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "10mb" }));

app.use(getSession());

app.use("/api/users", require("./routes/users"));
app.use("/api/files", require("./routes/files"));
app.use("/api/stats", require("./routes/stats"));

app.use(express.static(path.join(__dirname, "build")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(process.env.PORT || 9000, () => {
  console.log(`Server running on port ${process.env.PORT || 9000}`);
});
