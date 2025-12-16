const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = 8088;

const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const UPLOAD_DIR = process.env.UPLOAD_DIR || "/data";
const MAX_MB = Number(process.env.MAX_MB || 3);

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// serve files
app.use("/slips", express.static(UPLOAD_DIR));

// upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || ".jpg").toLowerCase();
    const name = crypto.randomBytes(16).toString("hex") + ext;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png"].includes(file.mimetype);
    cb(ok ? null : new Error("Only JPG/PNG allowed"), ok);
  }
});

// POST /upload/slip?shopId=...&orderId=...
app.post("/upload/slip", upload.single("file"), (req, res) => {
  const shopId = req.query.shopId || "unknown";
  const orderId = req.query.orderId || "unknown";
  const filename = req.file.filename;

  // (optional) คุณจะย้ายไฟล์ไปโฟลเดอร์ย่อยตาม shop/order ก็ได้ภายหลัง
  const slipUrl = `${BASE_URL}/slips/${filename}`;

  res.json({ shopId, orderId, slipUrl });
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Upload API on ${PORT}`));

