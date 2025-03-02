import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const app = express();
app.use(cors());
app.use(express.json());

const pool = new pg.Pool({
   connectionString: process.env.DATABASE_URL,
   ssl: { rejectUnauthorized: false }
});

// ✅ Create /tasks route to fetch from PostgreSQL
app.get("/tasks", async (req, res) => {
   try {
      const result = await pool.query("SELECT * FROM tasks");
      res.json(result.rows);
   } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Internal Server Error" });
   }
});

// ✅ Confirm server is running
app.get("/", (req, res) => {
   res.send("DixonList API is running...");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
