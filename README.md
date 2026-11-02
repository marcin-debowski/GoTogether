# GoTogether

A full-stack web app for planning group trips. Friends create a shared group for a trip, build their own day-by-day schedules from a common list of attractions, and keep track of who paid for what.

## Features

- **Accounts:** registration, login, and logout, with sessions kept in an httpOnly JWT cookie and passwords hashed with bcrypt.
- **Trip groups:** create a group with a destination and dates, then add members by email. Each group has its own URL (for example, `/summer-in-rome/costs`).
- **Roles and permissions:** only group admins can add or remove members, and only members can see a group's data.
- **Attractions:** add, edit, and delete attractions with a location, description, and duration.
- **Drag-and-drop calendar:** drag attractions onto a timeline of the trip's days. The server rejects anything that overlaps an event already in your schedule.
- **Other members' calendars:** see what anyone else in the group has planned, in read-only mode.
- **Shared costs:** record an expense and split it equally or with custom amounts. A live balance shows how much each person has paid, owes, or should get back.

## Tech stack

| Area     | Technologies                                                           |
| -------- | ---------------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router, dnd-kit, Axios |
| Backend  | Node.js, Express 5, TypeScript, JWT, bcrypt                            |
| Database | MongoDB, Mongoose                                                      |
| Tooling  | Docker, Docker Compose, ESLint                                         |

## Technical highlights

- **Accurate money handling:** amounts are stored as whole cents to avoid floating-point rounding errors, and the server checks that the splits add up to the expense total.
- **Safe multi-step writes:** MongoDB transactions save an expense with its splits, and a group with its owner's membership, so a failure can't leave partial data behind.
- **Balances from aggregation:** balances are calculated from the expense data with MongoDB aggregation pipelines rather than stored separately, so they can't drift out of sync.
- **Scalable member lists:** the member list uses cursor-based pagination.
- **Server-side authorization:** a route middleware verifies the JWT, and controllers check group membership and role on each request.

## Project structure

```text
GoTogether/
├── Backend/            # REST API
│   ├── config/         # Database connection
│   ├── controllers/    # Request handling and business logic
│   ├── middleware/     # Login and JWT verification
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API endpoints
│   └── server.ts       # Entry point
├── Frontend/           # React single-page app
│   └── src/
│       ├── components/ # UI, grouped by feature
│       ├── context/    # Auth and current group state
│       ├── pages/      # Route-level views
│       └── routes/     # Routing and protected routes
└── compose.yml         # Runs the frontend and backend together
```

## Getting started

### Prerequisites

- Node.js 22, or Docker
- A MongoDB database running as a replica set, because the app uses transactions. A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster works.

### Configuration

Create `Backend/.env`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
PORT=4000
```

### Run with Docker

```bash
docker compose up --build
```

### Run without Docker

Start the backend and frontend in separate terminals:

```bash
cd Backend
npm install
npm run dev
```

```bash
cd Frontend
npm install
npm run dev
```

Either way, the app runs at <http://localhost:5173> and the API at <http://localhost:4000>.

## Roadmap

- **Dates:** a page for agreeing on the trip's dates (currently a placeholder).
- **Places:** a page for choosing the destination (currently a placeholder).
- **Member settings:** per-member options in the group.
