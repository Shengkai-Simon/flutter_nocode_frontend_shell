# Flutter NoCode Platform — Frontend Shell

The web management portal for the no-code Flutter UI builder. Users register, log in, manage their projects, and launch the visual editor from here.

Served at `/react/` via the platform's Nginx reverse proxy.

---

## Features

- **Authentication** — Register, login, logout, forgot/reset password, account unlock
- **Dashboard** — View and manage all projects
- **Editor Entry** — Launch the Flutter visual editor embedded via iframe
- **AI Assistant** — Integrated AI panel for layout generation (Create & Adjust modes)
- **i18n** — Multi-language support (English / Chinese)
- **Theme** — Light / dark mode

---

## Tech Stack

| Category     | Library                                |
|--------------|----------------------------------------|
| Framework    | React 19 + TypeScript                  |
| Build Tool   | Vite 6                                 |
| Styling      | Tailwind CSS 4 + shadcn/ui (Radix UI)  |
| State        | Zustand 5                              |
| Server State | TanStack React Query 5                 |
| Routing      | React Router DOM 7                     |
| Forms        | React Hook Form + Zod                  |
| i18n         | i18next + react-i18next                |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Backend services running (see `flutter_nocode_backend`)

### Development

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173` (maps to `/react/` through Nginx in Docker).

### Production (Docker)

Built and served automatically via `docker-compose.services.yml` in `flutter_nocode_backend`.

```bash
# Build image manually
docker build -t react-portal .

# Run container
docker run -p 80:80 react-portal
# Access at http://localhost/react/
```

---

## Project Structure

```
src/
├── components/       # Reusable UI components
├── hooks/            # Custom React hooks
├── layouts/          # Page layout shells (auth, dashboard)
├── lib/              # API paths, utilities, nav config
├── locales/          # i18n translation files
├── routes/           # Route definitions & guards
└── stores/           # Zustand stores (auth, session, theme, AI assistant)
```
