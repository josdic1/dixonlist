import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
   res.send("DixonList API is running...");
});

app.get("/tasks", (req, res) => {
   res.json([{ id: 1, task: "Test Task" }]);
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
