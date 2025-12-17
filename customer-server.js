import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.CUSTOMER_API_PORT || 4000;

// Load customer data from a JSON file (for demo)
const customers = JSON.parse(
  fs.readFileSync(path.resolve("./data/schema_customers.json"), "utf-8")
);

app.get("/customer/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const customer = customers.find((c) => c.id === id);
  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }
  res.json(customer);
});

app.listen(PORT, () => {
  console.log(`Customer API server running on http://localhost:${PORT}`);
});
