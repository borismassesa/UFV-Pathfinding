#!/bin/bash

# UFV Pathfinding Database Setup Script
# This script creates the database and runs all migrations

set -e  # Exit on any error

echo "🗄️ UFV Pathfinding Database Setup"
echo "=================================="

# Configuration
DB_NAME="ufv_pathfinding"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL status..."
if pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    print_status "PostgreSQL is running"
else
    print_error "PostgreSQL is not running. Please start PostgreSQL first:"
    echo "  brew services start postgresql@14"
    exit 1
fi

# Create database if it doesn't exist
echo "🏗️ Creating database if it doesn't exist..."
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    print_warning "Database '$DB_NAME' already exists"
else
    createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
    print_status "Created database '$DB_NAME'"
fi

# Run migrations in order
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS=(
    "001_create_spatial_extensions.sql"
    "002_create_buildings_table.sql" 
    "003_create_rooms_table.sql"
    "004_create_navigation_graph.sql"
)

echo "🚀 Running database migrations..."
for migration in "${MIGRATIONS[@]}"; do
    echo "   📄 Running $migration..."
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$SCRIPT_DIR/$migration" > /dev/null 2>&1; then
        print_status "Migration $migration completed"
    else
        print_error "Migration $migration failed"
        echo "Manual command: psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $SCRIPT_DIR/$migration"
        exit 1
    fi
done

# Verify tables were created
echo "🔍 Verifying database setup..."
TABLE_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'spatial';" | xargs)

if [ "$TABLE_COUNT" -ge "4" ]; then
    print_status "Database setup completed successfully!"
    print_status "Created $TABLE_COUNT tables in spatial schema"
    
    # Show table list
    echo ""
    echo "📋 Created tables:"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'spatial' ORDER BY table_name;"
    
else
    print_error "Database setup incomplete. Expected at least 4 tables, found $TABLE_COUNT"
    exit 1
fi

echo ""
echo "🎉 Database setup completed!"
echo "   Database: $DB_NAME"
echo "   Schema: spatial"
echo "   Tables: buildings, rooms, navigation_nodes, navigation_edges"
echo ""
echo "🔗 Connection details:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""
echo "📝 To connect manually:"
echo "   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME" 