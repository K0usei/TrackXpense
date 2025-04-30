# Utility Scripts

TrackXpense includes several utility scripts to help with common tasks. This document provides information about these scripts and how to use them.

## Installation Scripts

These scripts help with installing and setting up the project dependencies.

### install-all.ps1

Located in the root directory, this script installs all dependencies for both frontend and backend.

```bash
# Run from the project root
.\install-all.ps1
```

What it does:
- Installs npm packages for the frontend
- Creates a Python virtual environment for the backend if it doesn't exist
- Installs Python dependencies
- Generates the Prisma client for database access

### clean-install-and-start.ps1

Located in the root directory, this script performs a clean installation of frontend dependencies.

```bash
# Run from the project root
.\clean-install-and-start.ps1
```

What it does:
- Removes node_modules and package-lock.json
- Reinstalls npm packages
- Provides instructions for starting the servers using the traditional methods

## Backend Scripts

These scripts help with backend-specific tasks.

### generate-prisma.ps1

Located in the backend directory, this script handles Prisma database operations.

```bash
# Run from the backend directory
.\generate-prisma.ps1
```

What it does:
- Generates the Prisma client
- Runs database migrations
- Seeds the database with initial data

### run_retraining.ps1

Located in the backend/tasks directory, this script runs the model retraining task.

```bash
# Run from the backend directory
.\tasks\run_retraining.ps1
```

What it does:
- Creates a log file in the logs directory
- Runs the retraining script with a minimum feedback threshold
- Logs the results of the retraining process

You can schedule this script to run periodically using Windows Task Scheduler to keep your models up-to-date.

## Frontend Scripts

These scripts help with frontend-specific tasks.

### reinstall-deps.ps1

Located in the admin directory, this script cleans and reinstalls frontend dependencies.

```bash
# Run from the admin directory
.\reinstall-deps.ps1
```

What it does:
- Removes the node_modules directory and package-lock.json
- Reinstalls all dependencies with npm install

Use this script when you encounter dependency-related issues or after pulling significant changes from the repository.
