import express from 'express';
import { body } from 'express-validator';
import {
  getAllCandidates,
  getDistinctPositions,
  updateCandidateStatus,
} from '../controllers/candidateController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

/**
 * @swagger
 * /api/candidates:
 *   get:
 *     summary: Get all candidates with filters
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, getAllCandidates);

/**
 * @swagger
 * /api/candidates/{id}:
 *   get:
 *     summary: Get candidate by ID with history and documents
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 */

router.get('/positions', authenticateToken, getDistinctPositions);

router.put('/status/:id', authenticateToken, updateCandidateStatus);

export default router;

