# Root Cause Analysis: WebSocket Driver Initialization Failure

## Issue Summary
The NestJS backend was experiencing container restarts with the error message "No driver (WebSockets) has been selected" despite having `@nestjs/platform-socket.io` installed and properly configured.

## Root Cause
The issue was caused by how NestJS 11 handles WebSocket adapter initialization. Even though `@nestjs/platform-socket.io` was correctly installed as a dependency, the framework's automatic adapter loading mechanism was failing to properly initialize the WebSocket driver during application startup.

This typically occurs in NestJS 11 when:
1. The WebSocket adapter isn't explicitly configured
2. There are version compatibility issues between `@nestjs/websockets`, `@nestjs/platform-socket.io`, and the core NestJS framework
3. The application context doesn't properly resolve the WebSocket driver during bootstrapping

## Technical Details
The error originates from NestJS's internal `loadAdapter` function which throws "No driver (WebSockets) has been selected" when it cannot find or load the required adapter package properly.

## Solution Applied
The fix was implemented in `/home/anielk/creator-platform/backend/src/main.ts` by explicitly setting the WebSocket adapter:

```typescript
app.useWebSocketAdapter(new IoAdapter(app.getHttpServer()));
```

This ensures that:
- The correct WebSocket driver (`@nestjs/platform-socket.io`) is selected
- It's properly initialized with the HTTP server instance
- It bypasses the automatic loading mechanism that was causing the error