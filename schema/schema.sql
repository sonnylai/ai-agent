CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  total_amount NUMERIC,
  created_at TIMESTAMP DEFAULT NOW(),
  status TEXT
);
