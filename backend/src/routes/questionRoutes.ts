import express from 'express';
import {
  getAllQuestions,
  createQuestion,
  deleteQuestion,
  updateQuestion,
  getPositionsList,
} from '../controllers/questionController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = express.Router();

router.get('/positions', getPositionsList);
router.get('/', authenticateToken, getAllQuestions);


router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'recruiter'),
  createQuestion
);

router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteQuestion);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'recruiter'), updateQuestion);

export default router;

