import express from 'express';
import { body } from 'express-validator';
import {
  getAllCandidates,
  getDistinctPositions,
  updateCandidateStatus,
  getAllCandidatesUser,
  getLatestInterviewHistory ,
  upsertSchedule,
} from '../controllers/candidateController';
import { authenticateToken, authorizeRoles,verifyToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

router.get('/', authenticateToken, getAllCandidates);
router.get('/positions', authenticateToken, getDistinctPositions);
router.put('/status/:id', authenticateToken, updateCandidateStatus);


// USER ROUTES
router.get('/user/getAll', authenticateToken, getAllCandidatesUser);
router.get("/interview/latest/:candidate_id/:position_id",getLatestInterviewHistory);
router.put('/schedule', verifyToken, authenticateToken, upsertSchedule);




export default router;


