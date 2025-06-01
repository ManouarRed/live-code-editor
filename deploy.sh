#!/bin/bash

echo "📦 Installing dependencies..."
npm install

echo "🔧 Ensuring Vite is installed..."
npm install --save-dev vite

# Optional: if you're using React
npm install --save-dev @vitejs/plugin-react

echo "⚙️ Building the project..."
npm run build

echo "✅ Build complete. Files are in the dist/ folder."
