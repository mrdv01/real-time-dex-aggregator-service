
# Initialize Git
if (Test-Path .git) {
    Remove-Item .git -Recurse -Force
}
git init

# 1. Project Initialization
git add .gitignore package.json tsconfig.json .eslintrc.json
git commit -m "chore: initial project setup with typescript and eslint config"

# 2. Core Configuration & Types
git add src/config/ src/types/
git commit -m "feat: add application configuration and type definitions"

# 3. Utilities
git add src/utils/
git commit -m "feat: implement data transformation and token merging utilities"

# 4. Base Services
git add src/services/cache.service.ts src/services/dex/base-dex.service.ts
git commit -m "feat: setup redis cache service and base dex abstract class"

# 5. DEX Integrations
git add src/services/dex/dexscreener.service.ts src/services/dex/jupiter.service.ts src/services/dex/geckoterminal.service.ts
git commit -m "feat: integrate dexscreener, jupiter, and geckoterminal apis"

# 6. Aggregator Logic
git add src/services/aggregator.service.ts
git commit -m "feat: implement token aggregation service with caching strategy"

# 7. WebSocket Service (Push Architecture)
git add src/services/websocket.service.ts
git commit -m "feat: implement websocket service for real-time updates"

# 8. Background Jobs
git add src/jobs/
git commit -m "feat: add scheduled data refresh job for push-based updates"

# 9. Server & API Routes
git add src/app.ts src/server.ts src/routes/ src/middleware/
git commit -m "feat: setup express server, api routes, and error handling"

# 10. Frontend Initialization
git add frontend/package.json frontend/vite.config.ts frontend/index.html frontend/tsconfig* frontend/postcss.config.js frontend/tailwind.config.js
git commit -m "feat(frontend): initialize react project with vite and tailwind css"

# 11. Frontend Logic & Utils
git add frontend/src/index.css frontend/src/types.ts frontend/src/utils/
git commit -m "feat(frontend): add styles, types, and formatting utilities"

# 12. Frontend State Management
git add frontend/src/context/
git commit -m "feat(frontend): implement TokenContext for websocket and state management"

# 13. Frontend Components
git add frontend/src/components/ frontend/src/App.tsx frontend/src/main.tsx
git commit -m "feat(frontend): build dashboard, tokencard, and main layout with animations"

# 14. Scripts & Tests
git add src/scripts/ src/tests/
git commit -m "test: add integration tests, unit tests, and verification scripts"

# 15. Final Polish
git add .
git commit -m "chore: formatting, lint fixes, and final cleanup"

Write-Host "Git history simulation complete!"
