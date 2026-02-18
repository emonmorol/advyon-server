/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './app/config/swagger.config';
import globalErrorHandler from './app/middlewares/globalErrorhandler';
import notFound from './app/middlewares/notFound';
import router from './app/routes';
import { HealthRoutes } from './app/modules/health/health.route';

const app: Application = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow Cloudinary embeds
  }),
);

// Rate limiting - prevent brute force attacks
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20000, // Limit each IP to 20000 requests per hour
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting for health checks
  skip: (req) =>
    req.path === '/health' ||
    req.path === '/health/live' ||
    req.path === '/health/ready',
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// Stricter rate limit for auth routes (prevent brute force login)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Only 20 login attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
});

app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

//parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Parse CORS origins from environment variable
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS || 'http://localhost:5173'
).split(',');

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

// Log CORS configuration on startup (for debugging)
console.log('CORS enabled for origins:', ALLOWED_ORIGINS);

// Health check (no auth, no body parsing)
app.use('/api/v1/health', HealthRoutes);

// application routes
app.use('/api/v1', router);

// localhost:5000/api/v1/

app.get('/', (req: Request, res: Response) => {
  res.send('Hi Next Level Developer !');
});

app.use(globalErrorHandler);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//Not Found
app.use(notFound);

export default app;
