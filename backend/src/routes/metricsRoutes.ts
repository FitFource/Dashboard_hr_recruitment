import express from 'express';
import {
  getOverviewMetrics,
  getTopCandidatesToday,
  getCandidatesByRole,
  getApplicationTrends,
  getLevels,
  getMetricsUser,
  getNextInterview,
} from '../controllers/metricsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();


router.get('/overview', authenticateToken, getOverviewMetrics);
router.get('/top-candidates', authenticateToken, getTopCandidatesToday);
router.get('/top-by-role', authenticateToken, getCandidatesByRole);

router.get('/trends', authenticateToken, getApplicationTrends);

router.get('/levels', authenticateToken, getLevels);

// USER ROUTES
router.get('/user/overview', authenticateToken, getMetricsUser);
router.get('/user/next-interview', authenticateToken, getNextInterview);


export default router;


