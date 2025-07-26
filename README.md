![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![Built with Node.js](https://img.shields.io/badge/Built%20with-Node.js-lightgrey?style=for-the-badge\&logo=node.js)
![Framework: Express](https://img.shields.io/badge/Framework-Express-000?style=for-the-badge\&logo=express)
![Database: Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge\&logo=supabase)

## CSV-to-JSON Converter API

An Express app that parses CSV, writes nested JSON to Supabase, and reports age distribution.

---

### 🚀 Features

* Manual CSV parsing (no external CSV libs)
* Dot-notation headers → nested JSON
* Supabase (PostgreSQL) integration
* Age distribution analysis
* Clear error handling

---

### ⚙️ Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Env vars** (`.env`):

   ```env
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PORT=3000               # optional
   CSV_FILE_PATH=./csv/data.csv  # optional
   NODE_ENV=development    # optional
   ```

3. **Create table** (Supabase SQL editor):

   ```sql
   CREATE TABLE IF NOT EXISTS public.users (
     id SERIAL PRIMARY KEY,
     name VARCHAR NOT NULL,
     age INT NOT NULL,
     address JSONB,
     additional_info JSONB,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

   CREATE POLICY allow_service_role ON public.users
     FOR ALL USING (true);

   CREATE INDEX IF NOT EXISTS idx_users_age ON public.users(age);
   CREATE INDEX IF NOT EXISTS idx_users_address ON public.users USING GIN(address);
   CREATE INDEX IF NOT EXISTS idx_users_additional_info ON public.users USING GIN(additional_info);
   ```

4. **Run**

   ```bash
   npm start
   # or
   npm run dev
   ```

---

### 📡 API

#### POST `/upload`

* **Type:** `multipart/form-data`
* **Field:** `csvFile` (CSV only, max 10 MB)

**200 OK**

```json
{
  "success": true,
  "message": "CSV file \"data.csv\" processed successfully",
  "data": {
    "fileName": "data.csv",
    "fileSize": 1234,
    "totalProcessed": 15,
    "totalInserted": 15,
    "ageDistribution": {
      "under20": 1,
      "between20And40": 8,
      "between40And60": 4,
      "over60": 2,
      "total": 15
    }
  }
}
```

**Errors**

```json
{ "error": "No file uploaded", "message": "Upload a CSV in \"csvFile\"" }
{ "error": "Invalid file type", "message": "Only CSV files are allowed" }
{ "error": "Upload error", "message": "CSV must be under 10MB" }
{ "error": "Processing failed", "message": "Detailed error message" }
```

#### GET `/health`

Basic status JSON.

#### GET `/`

API info and usage.

---

### 📑 CSV format

Required headers:

* `name.firstName`
* `name.lastName`
* `age`

`address.*` → `address` object; others → `additional_info`.

---

### 📂 Project structure

```
.
├── app.js
├── .env
├── routes/
│   └── upload.js
├── services/
│   └── csvParser.js
├── utils/
│   └── jsonBuilder.js
├── db/
│   └── index.js
└── csv/
    └── data.csv
```

---

### 📈 Age distribution output

```
AGE DISTRIBUTION REPORT
<20 years:    1 users
20-40 years:  8 users
40-60 years:  4 users
>60 years:    2 users
Total:        15 users
```

