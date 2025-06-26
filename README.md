# UFV Pathfinding Project

A smart mobile wayfinding application built to simplify navigation across UFV's campuses and buildings. This system delivers clear, step-by-step indoor routing to enhance the student, staff, and visitor experience.

## 🎯 Core Features

### 📱 Mobile App Features
- **Interactive Campus & Building Maps** - High-resolution floor plans with pan/zoom and seamless floor switching
- **Room & Service Directory** - Search by room number, department, or faculty office
- **Accessibility-Aware Routing** - Options for elevators, ramps, and barrier-free paths
- **Multi-Language Support** - English, Swahili, and other UI options
- **Live Campus Alerts** - Pop-up notifications for building closures, event detours, or construction zones

### 🚀 Operational Benefits
- **Fewer On-Site Directional Requests** - Reduces front-desk interruptions
- **Smoother Foot Traffic** - Minimizes hallway congestion during peak times
- **Better Visitor Satisfaction** - Improves experience for new students and guests
- **Data-Driven Insights** - Anonymous heat-maps and usage statistics

### 🔮 Future Pipeline
- **Course Schedule Integration** - Auto-generate routes based on timetables
- **UFV Portal Connectivity** - Personalized waypoints and notifications
- **Voice-Guided Navigation** - Hands-free directions
- **Advanced Analytics Dashboard** - Real-time traffic flow monitoring

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Data Layer    │    │   Backend API   │    │   Mobile App    │
│                 │    │                 │    │                 │
│ • PostGIS DB    │◄──►│ • Express.js    │◄──►│ • React Native  │
│ • Redis Cache   │    │ • WebSocket     │    │ • TypeScript    │
│ • Spatial Data  │    │ • A* Algorithm  │    │ • Redux Store   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js + TypeScript
- **Database:** PostgreSQL with PostGIS
- **Cache:** Redis
- **Real-time:** Socket.IO
- **Authentication:** JWT
- **Documentation:** Swagger/OpenAPI

### Mobile
- **Framework:** React Native + TypeScript
- **State Management:** Redux Toolkit
- **Navigation:** React Navigation
- **Maps:** Custom SVG rendering
- **HTTP Client:** Axios
- **UI Components:** Custom + React Native Elements

### Data Processing
- **Language:** Python
- **Libraries:** GDAL, GeoPandas, Shapely
- **File Formats:** Shapefiles, GeoJSON
- **Database:** PostGIS for spatial operations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+ with PostGIS extension
- Redis 6+
- Python 3.9+
- React Native development environment

### Backend Setup
```bash
cd backend
npm install
cp config/.env.example config/.env
# Configure your .env file
npm run build
npm run db:migrate
npm run dev
```

### Mobile Setup
```bash
cd mobile
npm install
# iOS
npx react-native run-ios
# Android
npx react-native run-android
```

### Data Processing Setup
```bash
cd data-processing
pip install -r requirements.txt
python scripts/process_shapefiles.py
```

## 📊 Development Status

### Phase 1: Data Processing ✅ In Progress
- [x] Project structure setup
- [ ] Shapefile processing pipeline
- [ ] Database schema design
- [ ] Graph generation algorithms
- [ ] Data validation scripts

### Phase 2: Backend Development 🚧 30% Complete
- [x] Express.js server architecture
- [x] Middleware setup (auth, CORS, rate limiting)
- [ ] Database models and migrations
- [ ] Pathfinding service (A* algorithm)
- [ ] REST API endpoints
- [ ] WebSocket real-time features
- [ ] Authentication system

### Phase 3: Mobile Development 📋 Planned
- [ ] React Native app configuration
- [ ] Navigation setup
- [ ] Map rendering component
- [ ] Search functionality
- [ ] Real-time location tracking
- [ ] User interface design
- [ ] State management

### Phase 4: Integration & Testing 📋 Planned
- [ ] API integration
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] User acceptance testing

## 🗂️ Project Structure

```
UFVPathfinding/
├── backend/              # Node.js API server
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── models/       # Database models
│   │   ├── services/     # Business logic
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Custom middleware
│   │   └── utils/        # Helper functions
│   ├── config/          # Configuration files
│   ├── scripts/         # Database scripts
│   └── tests/           # Test suites
├── mobile/              # React Native app
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── screens/     # App screens
│   │   ├── services/    # API clients
│   │   ├── store/       # Redux store
│   │   └── utils/       # Utility functions
│   └── assets/          # Images, fonts, icons
├── data-processing/     # Python data scripts
│   ├── scripts/         # Processing scripts
│   └── output/          # Processed data
├── shared/              # Shared TypeScript types
└── docs/                # Documentation
```

## 📋 API Endpoints

### Core Navigation APIs
- `GET /api/v1/rooms` - Get all rooms and locations
- `GET /api/v1/rooms/search` - Search rooms by query
- `POST /api/v1/pathfinding/route` - Calculate route between points
- `GET /api/v1/navigation/directions` - Get turn-by-turn directions
- `GET /api/v1/buildings` - Get building information
- `GET /api/v1/floors` - Get floor plans and metadata

### Real-time Features
- `WebSocket /socket.io` - Live location updates
- `GET /api/v1/alerts` - Campus alerts and notifications
- `POST /api/v1/analytics/track` - Usage analytics

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e      # End-to-end tests

# Mobile tests
cd mobile
npm test              # Component tests
npm run test:e2e      # E2E tests with Detox
```

## 📚 Documentation

- [API Documentation](docs/api/) - Complete API reference
- [Architecture Guide](docs/architecture/) - System design and patterns
- [Deployment Guide](docs/deployment/) - Production deployment instructions
- [Development Guide](docs/development/) - Development setup and guidelines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Project Lead:** UFV Development Team
- **Backend:** Node.js/TypeScript specialists
- **Mobile:** React Native developers
- **Data:** GIS and spatial data experts

---

**UFV Pathfinding** - Transforming complex campus layouts into intuitive, on-demand guidance 🗺️
