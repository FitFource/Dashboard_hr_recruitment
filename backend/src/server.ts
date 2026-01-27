import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { handleError } from './middleware/validation';

// Routes
import authRoutes from './routes/authRoutes';
import candidateRoutes from './routes/candidateRoutes';
import metricsRoutes from './routes/metricsRoutes';
import questionRoutes from './routes/questionRoutes';
import requirementRoutes from './routes/requirementRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/requirements', requirementRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'HR Recruitment Dashboard API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(handleError);

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   🚀 HR Recruitment Dashboard API Server        ║
╠═══════════════════════════════════════════════════╣
║   Port: ${PORT}                                    ║
║   Environment: ${process.env.NODE_ENV || 'development'}                      ║
║   API Docs: http://localhost:${PORT}/api-docs     ║
╚═══════════════════════════════════════════════════╝
  `);
});

export default app;

