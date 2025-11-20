import express from 'express';
import {
  getOverviewMetrics,
  getTopCandidatesToday,
  getCandidatesByRole,
  getApplicationTrends,
} from '../controllers/metricsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/metrics/overview:
 *   get:
 *     summary: Get overview metrics (total, accepted, rejected, in progress)
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/overview', authenticateToken, getOverviewMetrics);

/**
 * @swagger
 * /api/metrics/top-candidates:
 *   get:
 *     summary: Get top 10 most processed candidates today
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/top-candidates', authenticateToken, getTopCandidatesToday);

/**
 * @swagger
 * /api/metrics/top-by-role:
 *   get:
 *     summary: Get top 10 candidates per job role
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/top-by-role', authenticateToken, getCandidatesByRole);

/**
 * @swagger
 * /api/metrics/trends:
 *   get:
 *     summary: Get application trends over time
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/trends', authenticateToken, getApplicationTrends);

export default router;
