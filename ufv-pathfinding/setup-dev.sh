#!/bin/bash

echo "🚀 Setting up UFV Pathfinding development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first:"
    echo "   https://docs.docker.com/desktop/"
    exit 1
fi

# Start databases
echo "📦 Starting PostgreSQL and Redis containers..."
docker compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Install backend dependencies
cd apps/backend
npm install
cd ../..

# Install mobile app dependencies
cd apps/mobile
npm install
cd ../..

# Install shared package dependencies
cd packages/shared
npm install
npm run build
cd ../..

# Create .env file for backend
if [ ! -f apps/backend/.env ]; then
    echo "📝 Creating backend .env file..."
    cp apps/backend/.env.example apps/backend/.env
    echo "✅ Please update apps/backend/.env with your configuration"
fi

echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Update apps/backend/.env with your configuration"
echo "2. Run 'npm run dev' to start development servers"
echo "3. Access API docs at http://localhost:3000/api/docs"
echo "4. Access PgAdmin at http://localhost:5050 (admin@ufv.ca / admin123)"