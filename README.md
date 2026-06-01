# MediFlow Connect

**MediFlow Connect** is a sophisticated healthcare management platform designed to streamline medical workflows, inventory tracking, and communication. Built with performance and security in mind, it provides a seamless experience for healthcare professionals to manage their daily operations.

## 🚀 Technology Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (Full-stack React with SSR)
- **Frontend**: React 19, Vite, Tailwind CSS (v4)
- **Icons**: Lucide React
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL, Real-time, Edge Functions)
- **State & Routing**: TanStack Query & TanStack Router
- **UI Architecture**: Radix UI & Shadcn/ui based components

## 📂 Project Structure

The project follows a clean "Frontend/Backend" separation:

```text
mediflow-connect/
├── backend/                     # Backend infrastructure & Database
│   └── supabase/                # Supabase configurations
│       ├── migrations/          # SQL database migrations (Phase-based)
│       └── config.toml          # Supabase CLI configuration
├── frontend/                    # Application source code & UI
│   ├── src/                     # React application logic
│   │   ├── components/          # Reusable UI components & Radix primitives
│   │   ├── hooks/               # Custom React hooks for business logic
│   │   ├── integrations/        # Supabase types & client initialization
│   │   ├── lib/                 # Core utilities, state Management, & error handling
│   │   ├── routes/              # File-based routing (TanStack Router)
│   │   ├── server.ts            # SSR Server entry point
│   │   ├── start.ts             # Application client entry point
│   │   └── styles.css           # Global styling & Tailwind directives
│   ├── public/                  # Static assets & images
│   ├── package.json             # Frontend dependencies & dev scripts
│   ├── vite.config.ts           # Vite build configuration
│   └── tsconfig.json            # TypeScript configuration
└── .gitignore                   # Project-wide version control rules
```

## 🗝️ Key Features

- **Real-time Chat**: Seamless communication with integrated notification systems.
- **Inventory Management**: Robust tracking with automated stock updates and transfer workflows.
- **Order Management**: Complete lifecycle tracking from placement to delivery.
- **Security & Compliance**: Row-level Security (RLS) policies and comprehensive audit logging.
- **Modern UI**: Dark mode support, glassmorphism aesthetics, and responsive layout.

## 🛠️ Development Setup

### Prerequisites
- Node.js (Latest LTS)
- npm or pnpm

### Getting Started

1. **Clone the repository**
2. **Setup Frontend**:
   ```bash
   cd frontend
   npm install
   ```
3. **Configure Environment**:
   Create a `.env` file in the `frontend` folder:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:8080`.

## 📄 License
Private Repository - All Rights Reserved.
