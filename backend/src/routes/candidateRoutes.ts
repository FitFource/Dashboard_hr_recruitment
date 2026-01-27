import express from 'express';
import {
  getAllCandidates,
  getDistinctPositions,
  updateCandidateStatus,
  getAllCandidatesUser,
  getLatestInterviewHistory ,
  upsertSchedule,
  updateTechLink,
} from '../controllers/candidateController';
import { authenticateToken,verifyToken } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticateToken, getAllCandidates);
router.get('/positions', authenticateToken, getDistinctPositions);
router.put('/status/:id', authenticateToken, updateCandidateStatus);


// USER ROUTES
router.get('/user/getAll', authenticateToken, getAllCandidatesUser);
router.get("/interview/latest/:candidate_id/:position_id",getLatestInterviewHistory);
router.put('/schedule', verifyToken, authenticateToken, upsertSchedule);
router.put('/:id/tech-link', verifyToken, authenticateToken,updateTechLink);




export default router;


