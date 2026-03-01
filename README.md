# Location API

Location logging and geo-fence tracking API. Receives user location data, compares it against predefined geographic areas (polygons), and logs area entry events asynchronously.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | NestJS 11.x | REST API framework |
| Language | TypeScript 5.x | Type safety |
| Database | PostgreSQL 16 + PostGIS 3.4 | Spatial queries for geo-fencing |
| ORM | TypeORM 0.3.x | PostGIS raw query support |
| Queue | BullMQ 5.x | Async location processing |
| Cache | Redis 7.x | BullMQ backend + duplicate entry check |
| Docs | Swagger | Interactive API documentation |

## Setup

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### Installation

```bash
# Clone and install
npm install

# Copy env file
cp .env.example .env

# Start PostgreSQL (PostGIS) and Redis
docker-compose up -d

# Start the application
npm run start:dev
```

The API runs at `http://localhost:3000` and Swagger UI at `http://localhost:3000/api`. The dashboard UI is available at `http://localhost:3000`.

## API Endpoints

### POST /locations

Receives user location and queues it for async processing. Returns 202 immediately.

```bash
curl -X POST http://localhost:3000/locations \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "latitude": 41.0082,
    "longitude": 28.9784,
    "timestamp": "2025-02-28T10:30:00Z"
  }'
```

Response: `202 Accepted`
```json
{
  "status": "queued",
  "message": "Location received and queued for processing"
}
```

### POST /areas

Creates a new geographic area with a GeoJSON polygon boundary.

```bash
curl -X POST http://localhost:3000/areas \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kadikoy",
    "boundary": {
      "type": "Polygon",
      "coordinates": [[[28.975, 40.990], [28.995, 40.990], [28.995, 41.010], [28.975, 41.010], [28.975, 40.990]]]
    }
  }'
```

### GET /areas

Lists all defined areas with boundaries as GeoJSON.

```bash
curl http://localhost:3000/areas
```

### GET /logs

Lists area entry logs with filtering and pagination.

```bash
curl "http://localhost:3000/logs?userId=user_123&page=1&limit=20"
```

Query parameters: `userId`, `areaId`, `startDate`, `endDate`, `page`, `limit`.

### DELETE /areas/:id

Deletes an area by ID.

```bash
curl -X DELETE http://localhost:3000/areas/<area-id>
```

### GET /queue/stats

Returns BullMQ queue metrics.

```bash
curl http://localhost:3000/queue/stats
```

Response:
```json
{
  "waiting": 0,
  "active": 2,
  "completed": 150,
  "failed": 0
}
```

### GET /health

System health check for database and Redis connectivity.

```bash
curl http://localhost:3000/health
```

## How It Works

1. User sends location via `POST /locations`
2. Location is added to BullMQ queue, 202 returned immediately
3. Queue processor picks up the job:
   - Saves location to `location_logs`
   - Runs PostGIS `ST_Contains` query to check which areas contain the point
   - For each matching area, logs entry to `area_entry_logs`
4. In `entry_only` mode (default), Redis tracks user's current areas via a per-user Set (`user-areas:{userId}`). When a user leaves an area, the entry is removed from the Set, allowing re-entry to be logged again

## Project Structure

```
src/
├── main.ts                              # Bootstrap, Swagger, ValidationPipe
├── app.module.ts                        # Root module
├── config/
│   └── configuration.ts                 # ENV config mapping
├── entities/
│   ├── index.ts                         # Barrel exports
│   ├── area.entity.ts                   # areas table
│   ├── location-log.entity.ts           # location_logs table
│   └── area-entry-log.entity.ts         # area_entry_logs table
├── modules/
│   ├── areas/                           # POST /areas, GET /areas, DELETE /areas/:id
│   ├── locations/                       # POST /locations + queue processor
│   ├── logs/                            # GET /logs
│   ├── queue-stats/                     # GET /queue/stats
│   └── health/                          # GET /health
└── common/
    ├── filters/
    │   └── http-exception.filter.ts     # Global error handler
    └── validators/
        └── polygon.validator.ts         # GeoJSON polygon validation
```

## Architecture Decisions

- **PostGIS** for polygon containment queries, GiST spatial index makes them fast
- **BullMQ** for async processing - Redis already needed, no extra infrastructure
- **TypeORM** over Prisma - better PostGIS raw query support
- **202 Accepted** for POST /locations - processing is async, 200 would be misleading
- **GeoJSON** format - industry standard, PostGIS supports it natively

## Dashboard

A Leaflet-based dashboard is served at `http://localhost:3000` with three tabs:

- **Areas** → draw polygons on the map to create/delete geographic areas
- **Simulation** → place virtual users, define routes, and watch them move in real-time sending location pings
- **Load Test** → draw a bounds rectangle on the map, configure RPS/duration, and run load tests with live metrics and queue stats

### Testing with the Dashboard

**1. Create an area:**
- Open the dashboard and stay on the **Areas** tab
- Use the polygon/rectangle draw tool on the left side of the map
- Draw a shape, give it a name, and save

**2. Run a simulation:**
- Switch to the **Simulation** tab
- Click **Add User** → click inside an area on the map to place a user
- Click **Define Route** → click waypoints on the map → click **Done**
- Click **Play** → the user moves along the route, sending location pings to the API
- Watch the Stats section for sent/success/failed counts

**3. Run a smoke test:**
- Switch to the **Load Test** tab
- Scroll to **Smoke Test** and click **Pick Point** → click inside an area on the map
- Click **Run Smoke Test** → sends 3 pings and verifies entry logs were created

**4. Run a load test:**
- On the **Load Test** tab, click **Draw** and drag a rectangle over an area on the map
- Configure **Requests/sec** and **Duration**
- Click **Start Load Test** → pings appear as black dots on the map
- Monitor live metrics (throughput, avg response time) and queue stats (waiting, active, completed, failed)

**5. Run a load test with k6:**

```bash
# Install k6: https://k6.io/docs/getting-started/installation/
k6 run loadtest/load-test.js
```

The script creates a test area on setup, then ramps up to 100 virtual users sending random locations inside that area. Results include request rate, response times, and error rate.
