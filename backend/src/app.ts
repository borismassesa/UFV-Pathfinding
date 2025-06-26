import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Import routes
import pathfindingRoutes from './routes/pathfinding';
import roomRoutes from './routes/rooms';
import navigationRoutes from './routes/navigation';
import emergencyRoutes from './routes/emergency';
import analyticsRoutes from './routes/analytics';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';

// Import services
import { DatabaseService } from './services/DatabaseService';
import { RedisService } from './services/RedisService';
import { RealTimeService } from './services/RealTimeService';

// Load environment variables
dotenv.config();

class App {
  public app: Application;
  public server: any;
  public io: SocketIOServer;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000');
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:19006'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeServices();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:19006'],
      methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: process.env.CORS_CREDENTIALS === 'true',
    }));

    // Compression middleware
    this.app.use(compression());

    // Logging middleware
    this.app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      message: {
        error: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api', limiter);
  }

  private initializeRoutes(): void {
    const apiPrefix = process.env.API_PREFIX || '/api';
    const apiVersion = process.env.API_VERSION || 'v1';
    const basePath = `${apiPrefix}/${apiVersion}`;

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API routes
    this.app.use(`${basePath}/pathfinding`, pathfindingRoutes);
    this.app.use(`${basePath}/rooms`, roomRoutes);
    this.app.use(`${basePath}/navigation`, navigationRoutes);
    this.app.use(`${basePath}/emergency`, emergencyRoutes);
    this.app.use(`${basePath}/analytics`, analyticsRoutes);

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize database connection
      await DatabaseService.getInstance().initialize();
      console.log('✅ Database connected successfully');

      // Initialize Redis connection
      await RedisService.getInstance().initialize();
      console.log('✅ Redis connected successfully');

      // Initialize real-time service
      const realTimeService = new RealTimeService(this.io);
      console.log('✅ Real-time service initialized');

    } catch (error) {
      console.error('❌ Service initialization failed:', error);
      process.exit(1);
    }
  }

  public listen(): void {
    this.server.listen(this.port, () => {
      console.log(`
🚀 UFV Pathfinding API Server
┌─────────────────────────────────┐
│  Server running on port ${this.port}    │
│  Environment: ${process.env.NODE_ENV?.padEnd(17) || 'development'.padEnd(17)}│
│  API Base: /api/v1              │
│  Health Check: /health          │
└─────────────────────────────────┘
      `);
    });
  }

  public getApp(): Application {
    return this.app;
  }

  public getServer(): any {
    return this.server;
  }
}

// Create and start the application
const app = new App();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  app.getServer().close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  app.getServer().close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Start the server if this file is run directly
if (require.main === module) {
  app.listen();
}

export default app;
