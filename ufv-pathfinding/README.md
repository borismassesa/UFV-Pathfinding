# UFV Pathfinding - Modern Indoor Navigation System

A comprehensive indoor navigation solution built with modern technologies for the University of the Fraser Valley (UFV). This monorepo contains the mobile app, backend API, and shared packages.

## 🏗️ Architecture

```
UFV Pathfinding Monorepo
├── apps/
│   ├── mobile/          # React Native + Expo SDK 51 app
│   └── backend/         # NestJS API server
├── packages/
│   ├── shared/          # Shared TypeScript types
│   └── ui/              # Shared UI components (future)
├── scripts/             # Development scripts
└── docs/                # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ 
- Docker Desktop
- iOS Simulator / Android Emulator
- Expo CLI

### Setup

1. **Clone and setup the development environment:**
   ```bash
   git clone <repository-url>
   cd ufv-pathfinding-monorepo
   chmod +x setup-dev.sh
   ./setup-dev.sh
   ```

2. **Start the development environment:**
   ```bash
   # Start databases (PostgreSQL + Redis)
   docker compose up -d
   
   # Install dependencies
   npm install
   
   # Start all development servers
   npm run dev
   ```

3. **Access the applications:**
   - Mobile App: Follow Expo CLI instructions
   - Backend API: http://localhost:3000/api/v1
   - API Documentation: http://localhost:3000/api/docs
   - Database Admin: http://localhost:5050

## 📱 Mobile App (React Native + Expo SDK 51)

### Features
- ✅ Modern React Native with Expo SDK 51
- ✅ Redux Toolkit with RTK Query for state management
- ✅ TypeScript with strict type checking
- ✅ React Navigation v7 for navigation
- ✅ Indoor positioning with Bluetooth beacons
- ✅ Real-time navigation with Socket.IO
- ✅ Offline-first architecture
- ✅ Push notifications
- ✅ Haptic feedback
- ✅ Dark mode support

### Development Commands
```bash
cd apps/mobile

# Start development server
npm run start

# Run on specific platform
npm run android
npm run ios

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🔧 Backend API (NestJS + TypeScript)

### Features
- ✅ NestJS with TypeScript
- ✅ PostgreSQL with PostGIS for spatial data
- ✅ Redis for caching and sessions
- ✅ JWT authentication with refresh tokens
- ✅ Socket.IO for real-time features
- ✅ Swagger/OpenAPI documentation
- ✅ Rate limiting and security headers
- ✅ A* pathfinding algorithm
- ✅ Beacon management system

### Development Commands
```bash
cd apps/backend

# Start development server
npm run start:dev

# Run tests
npm test

# Build for production
npm run build

# Run migrations
npm run db:migrate
```

## 🗄️ Database

### PostgreSQL with PostGIS
- Spatial data support for buildings, rooms, and navigation nodes
- Full-text search for room discovery
- Optimized indexes for spatial queries
- Support for multiple coordinate systems (UTM, WGS84)

### Schema Overview
- **buildings**: Campus buildings with spatial data
- **rooms**: Individual rooms with polygons and metadata
- **navigation_nodes**: Graph nodes for pathfinding
- **navigation_edges**: Connections between nodes
- **users**: User accounts and preferences
- **beacons**: Bluetooth beacon data for positioning

## 🔄 Development Workflow

### Monorepo Scripts
```bash
# Install all dependencies
npm install

# Start all development servers
npm run dev

# Build all packages
npm run build

# Run tests across all packages
npm test

# Lint all packages
npm run lint

# Clean all node_modules
npm run clean
```

### Adding New Features

1. **Define shared types** in `packages/shared/src/types/`
2. **Add API endpoints** in `apps/backend/src/modules/`
3. **Create mobile screens** in `apps/mobile/src/screens/`
4. **Update Redux store** with new slices and API endpoints

## 🧪 Testing

### Mobile App Testing
- Jest + React Native Testing Library
- Component testing
- Integration testing with mocked APIs
- E2E testing with Detox (coming soon)

### Backend Testing
- Jest + Supertest
- Unit tests for services and controllers
- Integration tests with test database
- API endpoint testing

## 📱 Indoor Positioning

### Technology Stack
- **Primary**: Bluetooth Low Energy (BLE) beacons
- **Secondary**: Wi-Fi fingerprinting
- **Fallback**: GPS (outdoor areas)
- **Accuracy**: 3-5 meters indoors

### Beacon Setup
1. Deploy beacons throughout the building
2. Calibrate positions using admin app
3. Configure beacon management in backend
4. Mobile app automatically discovers and uses beacons

## 🚀 Deployment

### Mobile App
```bash
# Build for app stores
npm run build:android
npm run build:ios

# Using EAS Build
eas build --platform all
```

### Backend API
```bash
# Production build
npm run build

# Docker deployment
docker build -t ufv-pathfinding-api .
docker run -p 3000:3000 ufv-pathfinding-api
```

## 📊 Key Performance Indicators

### Technical Metrics
- **Route Calculation**: < 500ms
- **Positioning Accuracy**: < 3 meters (95% of time)
- **App Startup**: < 2 seconds
- **Battery Impact**: < 5% per hour
- **API Response Time**: < 200ms (95th percentile)

### User Metrics
- **Target Adoption**: 60% of students in 6 months
- **Navigation Success Rate**: > 95%
- **User Satisfaction**: > 4.5/5 stars
- **Daily Active Users**: 40% of registered users

## 🛡️ Security

- JWT tokens with refresh mechanism
- Rate limiting on all endpoints
- Input validation and sanitization
- HTTPS enforcement
- Helmet.js security headers
- SQL injection prevention with TypeORM

## 🌐 Internationalization

- Support for English, French, and Spanish
- RTL language support ready
- Dynamic language switching
- Localized navigation instructions

## 📚 Documentation

- [API Documentation](http://localhost:3000/api/docs) - Interactive Swagger docs
- [Architecture Guide](docs/architecture.md) - System design details
- [Deployment Guide](docs/deployment.md) - Production deployment
- [Contributing Guide](docs/contributing.md) - Development guidelines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Technical Lead**: Modern full-stack development
- **Mobile Team**: React Native specialists
- **Backend Team**: NestJS and spatial data experts
- **DevOps**: CI/CD and infrastructure automation

---

**Built with ❤️ for UFV students and the community**