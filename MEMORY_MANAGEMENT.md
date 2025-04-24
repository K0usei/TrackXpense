# Memory Management in TrackXpense

TrackXpense can sometimes require significant memory resources, especially when processing large amounts of data or when running for extended periods. This document provides guidance on managing memory usage to prevent "JavaScript heap out of memory" errors.

## Common Memory Issues

The most common memory-related error you might encounter is:

```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

This occurs when Node.js runs out of memory to allocate for JavaScript objects.

## Solutions

### 1. Using Memory-Optimized Scripts

We've included several memory-optimized scripts in the `package.json` file:

```bash
# Development with increased memory
npm run dev:memory

# Build with increased memory
npm run build:memory

# Production start with increased memory
npm run start:memory
```

These scripts allocate 4GB of memory to Node.js, which should be sufficient for most use cases.

### 2. Using Batch Files (Windows)

For Windows users, we've included batch files that set the memory limit:

```bash
# Start development server with increased memory
start-with-more-memory.bat

# Build with increased memory
build-with-more-memory.bat
```

### 3. Manual Memory Allocation

You can manually set the memory limit by setting the `NODE_OPTIONS` environment variable:

```bash
# For Windows
set NODE_OPTIONS=--max-old-space-size=4096
npm run dev

# For macOS/Linux
export NODE_OPTIONS=--max-old-space-size=4096
npm run dev
```

You can adjust the value (4096 = 4GB) based on your system's available memory.

## Memory Optimization Tips

1. **Limit the number of notifications**: The notifications feature is paginated to prevent loading too many at once.

2. **Clear old notifications**: Regularly delete old notifications to prevent the database from growing too large.

3. **Restart the application**: If you notice the application becoming slow or using excessive memory, restarting it can help clear memory.

4. **Monitor memory usage**: Use tools like Task Manager (Windows), Activity Monitor (macOS), or `top` (Linux) to monitor memory usage.

## System Requirements

For optimal performance, we recommend:

- At least 8GB of RAM
- Modern multi-core processor
- 1GB of free disk space

If you continue to experience memory issues after trying these solutions, please report the issue with details about your system configuration and the steps to reproduce the problem.
