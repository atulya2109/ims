# Logging Documentation

This document explains the logging system implemented in the IMS application.

## Overview

The application uses **Pino**, a high-performance JSON logger for Node.js, with automatic log rotation and structured logging.

## Logger Configuration

Location: [`src/lib/logger.ts`](../src/lib/logger.ts)

### Log Levels

- **debug** - Detailed information for debugging (development only)
- **info** - General informational messages
- **warn** - Warning messages
- **error** - Error messages with stack traces

### Environment Behavior

**Development:**
- Logs to console (stdout)
- Pretty-printed format for readability
- Debug level enabled
- Synchronous writes to avoid missing logs

**Production:**
- Logs to rotating files in `./logs/` directory
- JSON format for easy parsing
- Info level and above
- Automatic file rotation (daily or 10MB size limit)
- Rotated files are compressed with gzip

## Log Files

Production log files (in `./logs/` directory):
- `app.log` - All application logs (info and above)
- `error.log` - Error logs only
- Files rotate daily or when reaching 10MB
- Rotated logs are compressed and timestamped (e.g., `app.log.20241205.gz`)

## Helper Functions

### `logApiRequest(method, path, additionalInfo?)`
Logs incoming API requests.

```typescript
logApiRequest("GET", "/api/equipments");
```

### `logApiResponse(method, path, statusCode, duration?, additionalInfo?)`
Logs API responses with status code and duration.

```typescript
logApiResponse("GET", "/api/equipments", 200, 45, { count: 10 });
```

### `logError(error, context?)`
Logs errors with stack traces and context.

```typescript
logError(error, { method: "POST", path: "/api/checkout", userId: "123" });
```

### `logDatabaseOperation(operation, collection, duration?, additionalInfo?)`
Logs database operations with performance metrics.

```typescript
logDatabaseOperation("find", "equipments", 12, { count: 50 });
```

## Log Structure

All logs are structured JSON with the following fields:

```json
{
  "level": "INFO",
  "time": "2024-12-05T10:30:45.123Z",
  "env": "production",
  "method": "GET",
  "path": "/api/equipments",
  "statusCode": 200,
  "duration": 45,
  "count": 10,
  "msg": "API Response"
}
```

## API Routes with Logging

All API routes have been instrumented with logging:

- **GET /api/equipments** - Logs request, database query, response
- **POST /api/equipments** - Logs request, insert operation, response
- **PUT /api/equipments** - Logs request, update operation, response, validation errors
- **DELETE /api/equipments** - Logs request, delete operation, response
- **GET /api/users** - Logs request, database query, response
- **POST /api/users** - Logs request, insert operation, response
- **PUT /api/users** - Logs request, update operation, response
- **DELETE /api/users** - Logs request, delete operation, response
- **POST /api/checkout** - Logs request, transaction, response, errors
- **GET /api/checkout** - Logs request, database query, response
- **POST /api/checkin** - Logs request, transaction, response, errors
- **GET /api/checkin** - Logs request, database query, response

## Performance Tracking

Every API request logs:
- **Total duration** - Time from request to response
- **Database duration** - Time spent in database operations
- **Operation details** - Records affected, items processed, etc.

Example log showing slow operation:
```json
{
  "level": "INFO",
  "time": "2024-12-05T10:30:45.123Z",
  "method": "POST",
  "path": "/api/checkout",
  "statusCode": 200,
  "duration": 1250,
  "checkoutId": "abc-123",
  "itemCount": 5,
  "msg": "API Response"
}
```

## Viewing Logs

### Development
Logs appear in the console with color coding and formatting.

### Production

**View all logs:**
```bash
docker-compose -f deployment/docker/docker-compose.prod.yml logs -f app
```

**View log files:**
```bash
# On the NAS/server
cat logs/app.log | jq '.'                    # Pretty print JSON
tail -f logs/app.log | jq '.'                # Follow logs
grep -i "error" logs/error.log | jq '.'      # Filter errors
```

**Filter by log level:**
```bash
cat logs/app.log | jq 'select(.level=="ERROR")'
```

**Filter by API endpoint:**
```bash
cat logs/app.log | jq 'select(.path=="/api/checkout")'
```

**Find slow requests (>1000ms):**
```bash
cat logs/app.log | jq 'select(.duration > 1000)'
```

## Troubleshooting

### No logs appearing in development
- Check that you're running `npm run dev`
- Logs should appear in the console

### No log files in production
- Ensure `./logs/` directory exists and is writable
- Check Docker volume mounts in `docker-compose.prod.yml`
- Verify `NODE_ENV=production` is set

### Log files getting too large
- Default rotation is 10MB or daily
- Rotated files are automatically compressed with gzip
- Adjust rotation settings in [`src/lib/logger.ts`](../src/lib/logger.ts):
  ```typescript
  size: "10M",      // Change to "5M" for 5MB
  interval: "1d"    // Change to "12h" for twice daily
  ```

### Finding specific errors
Use `jq` to filter logs:
```bash
# All errors for a specific user
cat logs/error.log | jq 'select(.userId=="user-123")'

# All checkout errors
cat logs/error.log | jq 'select(.path=="/api/checkout")'

# Errors with stack traces
cat logs/error.log | jq 'select(.error.stack)'
```

## Best Practices

1. **Always use the logger functions** - Don't use `console.log()` in production code
2. **Include context** - Add relevant information (userId, equipmentId, etc.)
3. **Track performance** - Log duration for database operations
4. **Log errors properly** - Use `logError()` to capture stack traces
5. **Don't log sensitive data** - Avoid logging passwords, tokens, or PII

## Example Usage

```typescript
import { logApiRequest, logApiResponse, logError, logDatabaseOperation } from "@ims/lib/logger";

export async function GET(request: Request) {
  const startTime = Date.now();
  logApiRequest("GET", "/api/equipments");

  try {
    const db = await getDb();
    const collection = db.collection("equipments");

    const dbStart = Date.now();
    const equipments = await collection.find({}).toArray();
    logDatabaseOperation("find", "equipments", Date.now() - dbStart, {
      count: equipments.length
    });

    const duration = Date.now() - startTime;
    logApiResponse("GET", "/api/equipments", 200, duration, {
      count: equipments.length
    });

    return new Response(JSON.stringify(equipments), { status: 200 });
  } catch (error) {
    logError(error, { method: "GET", path: "/api/equipments" });
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
```

## Monitoring and Alerts

For production monitoring, consider:
- Setting up log aggregation (e.g., ELK stack, Grafana Loki)
- Creating alerts for error rates
- Monitoring API response times
- Tracking database operation duration
