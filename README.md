# CloudGallery - Image Sharing App

A full-stack cloud-native image sharing and photo gallery application built for a Cloud Computing course project.

## Cloud Computing Concepts Demonstrated

| Concept | Implementation |
|---------|---------------|
| Cloud Object Storage | Supabase Storage (S3-compatible) for image uploads |
| Cloud Database | Supabase PostgreSQL (managed cloud database) |
| Authentication & IAM | JWT-based auth + Row Level Security policies |
| Access Control | Private albums, share links with expiration |
| CDN Delivery | Supabase serves assets via global CDN |
| Scalability | Stateless API + cloud storage = horizontally scalable |

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (Supabase)
- **Storage:** Supabase Storage (S3-compatible)
- **Auth:** JWT + bcrypt

## Setup Instructions

### 1. Create Supabase Project (Free, No Credit Card)

1. Go to [supabase.com](https://supabase.com) and sign up with GitHub
2. Click **New Project** → pick a name and password → create
3. Go to **SQL Editor** → paste contents of `supabase-setup.sql` → click **Run**
4. Go to **Storage** → click **New Bucket** → name it `images` → set it to **Public**
5. Go to **Settings → API** → copy your Project URL, anon key, and service_role key

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase credentials
npm install
npm start
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000 and proxies API calls to http://localhost:5000.
