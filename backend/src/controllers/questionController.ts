// import { Request, Response } from 'express';
// import pool from '../database/connection';
// import { InterviewQuestion } from '../types';
// import { AuthRequest } from '../middleware/auth';
// import csvParser from 'csv-parser';
// import xlsx from 'xlsx';
// import fs from 'fs';

// export const getAllQuestions = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { job_role, difficulty, category } = req.query;

//     let query = 'SELECT * FROM interview_questions WHERE 1=1';
//     const params: any[] = [];
//     let paramCount = 1;

//     if (job_role) {
//       query += ` AND job_role ILIKE $${paramCount}`;
//       params.push(`%${job_role}%`);
//       paramCount++;
//     }

//     if (difficulty) {
//       query += ` AND difficulty = $${paramCount}`;
//       params.push(difficulty);
//       paramCount++;
//     }

//     if (category) {
//       query += ` AND category ILIKE $${paramCount}`;
//       params.push(`%${category}%`);
//       paramCount++;
//     }

//     query += ' ORDER BY created_at DESC';

//     const result = await pool.query<InterviewQuestion>(query, params);
//     res.json({ questions: result.rows });
//   } catch (error) {
//     console.error('Error fetching questions:', error);
//     res.status(500).json({ error: 'Failed to fetch questions' });
//   }
// };

// export const createQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
//   try {
//     const { job_role, question, category, difficulty, expected_answer } = req.body;

//     const result = await pool.query<InterviewQuestion>(
//       `INSERT INTO interview_questions (job_role, question, category, difficulty, expected_answer, created_by)
//        VALUES ($1, $2, $3, $4, $5, $6)
//        RETURNING *`,
//       [job_role, question, category, difficulty, expected_answer, req.user?.id]
//     );

//     res.status(201).json({ question: result.rows[0] });
//   } catch (error) {
//     console.error('Error creating question:', error);
//     res.status(500).json({ error: 'Failed to create question' });
//   }
// };

// export const uploadQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
//   try {
//     if (!req.file) {
//       res.status(400).json({ error: 'No file uploaded' });
//       return;
//     }

//     const filePath = req.file.path;
//     const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
//     const questions: any[] = [];

//     if (fileExtension === 'csv') {
//       // Parse CSV
//       await new Promise((resolve, reject) => {
//         fs.createReadStream(filePath)
//           .pipe(csvParser())
//           .on('data', (row) => {
//             questions.push({
//               job_role: row.job_role || row['Job Role'],
//               question: row.question || row['Question'],
//               category: row.category || row['Category'],
//               difficulty: row.difficulty || row['Difficulty'],
//               expected_answer: row.expected_answer || row['Expected Answer'],
//             });
//           })
//           .on('end', resolve)
//           .on('error', reject);
//       });
//     } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
//       // Parse Excel
//       const workbook = xlsx.readFile(filePath);
//       const sheetName = workbook.SheetNames[0];
//       const worksheet = workbook.Sheets[sheetName];
//       const jsonData = xlsx.utils.sheet_to_json(worksheet);

//       jsonData.forEach((row: any) => {
//         questions.push({
//           job_role: row.job_role || row['Job Role'],
//           question: row.question || row['Question'],
//           category: row.category || row['Category'],
//           difficulty: row.difficulty || row['Difficulty'],
//           expected_answer: row.expected_answer || row['Expected Answer'],
//         });
//       });
//     } else if (fileExtension === 'json') {
//       // Parse JSON
//       const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
//       questions.push(...jsonData);
//     } else {
//       res.status(400).json({ error: 'Unsupported file format' });
//       return;
//     }

//     // Insert questions into database
//     const insertedQuestions = [];
//     for (const q of questions) {
//       if (q.job_role && q.question) {
//         const result = await pool.query<InterviewQuestion>(
//           `INSERT INTO interview_questions (job_role, question, category, difficulty, expected_answer, created_by)
//            VALUES ($1, $2, $3, $4, $5, $6)
//            RETURNING *`,
//           [
//             q.job_role,
//             q.question,
//             q.category || null,
//             q.difficulty || null,
//             q.expected_answer || null,
//             req.user?.id,
//           ]
//         );
//         insertedQuestions.push(result.rows[0]);
//       }
//     }

//     // Delete uploaded file
//     fs.unlinkSync(filePath);

//     res.status(201).json({
//       message: `Successfully uploaded ${insertedQuestions.length} questions`,
//       questions: insertedQuestions,
//     });
//   } catch (error) {
//     console.error('Error uploading questions:', error);
//     res.status(500).json({ error: 'Failed to upload questions' });
//   }
// };

// export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { id } = req.params;

//     const result = await pool.query(
//       'DELETE FROM interview_questions WHERE id = $1 RETURNING id',
//       [id]
//     );

//     if (result.rows.length === 0) {
//       res.status(404).json({ error: 'Question not found' });
//       return;
//     }

//     res.json({ message: 'Question deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting question:', error);
//     res.status(500).json({ error: 'Failed to delete question' });
//   }
// };


import { Request, Response } from 'express';
import pool from '../database/connection';
import { InterviewQuestion } from '../types';
import { AuthRequest } from '../middleware/auth';
import csvParser from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';

// ---------------------------------------------------------------------------
// GET ALL QUESTIONS
// ---------------------------------------------------------------------------
export const getAllQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { job_role, difficulty, category } = req.query;

    let query = `SELECT * FROM interview_questions WHERE 1=1`;
    const params: any[] = [];
    let index = 1;

    if (job_role) {
      query += ` AND job_role ILIKE $${index}`;
      params.push(`%${job_role}%`);
      index++;
    }

    if (difficulty) {
      query += ` AND difficulty = $${index}`;
      params.push(difficulty);
      index++;
    }

    if (category) {
      query += ` AND category ILIKE $${index}`;
      params.push(`%${category}%`);
      index++;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query<InterviewQuestion>(query, params);
    res.json({ questions: result.rows });

  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

// ---------------------------------------------------------------------------
// CREATE SINGLE QUESTION
// ---------------------------------------------------------------------------
export const createQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { job_role, question, category, difficulty, expected_answer } = req.body;

    const createdBy = req.user?.id || null;

    const result = await pool.query<InterviewQuestion>(
      `INSERT INTO interview_questions (job_role, question, category, difficulty, expected_answer, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [job_role, question, category, difficulty, expected_answer, createdBy]
    );

    res.status(201).json({ question: result.rows[0] });

  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
};

// ---------------------------------------------------------------------------
// BULK UPLOAD QUESTIONS
// ---------------------------------------------------------------------------
export const uploadQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const filePath = req.file.path;
    const fileExt = req.file.originalname.split('.').pop()?.toLowerCase();
    const questions: any[] = [];

    // --------------------
    // CSV PARSER
    // --------------------
    if (fileExt === 'csv') {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('data', (row) => {
            questions.push(normalizeRow(row));
          })
          .on('end', resolve)
          .on('error', reject);
      });
    
    // --------------------
    // EXCEL PARSER
    // --------------------
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.SheetNames[0];
      const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheet]);

      rows.forEach((r: any) => questions.push(normalizeRow(r)));

    // --------------------
    // JSON PARSER
    // --------------------
    } else if (fileExt === 'json') {
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      jsonData.forEach((r: any) => questions.push(normalizeRow(r)));

    } else {
      res.status(400).json({ error: 'Unsupported file format' });
      return;
    }

    const createdBy = req.user?.id || null;
    const inserted: InterviewQuestion[] = [];

    for (const q of questions) {
      if (!q.job_role || !q.question) continue;

      const result = await pool.query<InterviewQuestion>(
        `INSERT INTO interview_questions (job_role, question, category, difficulty, expected_answer, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [q.job_role, q.question, q.category, q.difficulty, q.expected_answer, createdBy]
      );
      inserted.push(result.rows[0]);
    }

    fs.unlinkSync(filePath);

    res.status(201).json({
      message: `Successfully uploaded ${inserted.length} questions`,
      questions: inserted
    });

  } catch (error) {
    console.error('Error uploading questions:', error);
    res.status(500).json({ error: 'Failed to upload questions' });
  }
};

// ------------------------------------------------------
// DELETE QUESTION
// ------------------------------------------------------
export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM interview_questions WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    res.json({ message: 'Question deleted successfully' });

  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
};

// ------------------------------------------------------
// NORMALIZER FUNCTION
// ------------------------------------------------------
function normalizeRow(row: any) {
  return {
    job_role: row.job_role || row['Job Role'] || row['JOB ROLE'],
    question: row.question || row['Question'] || row['QUESTION'],
    category: row.category || row['Category'],
    difficulty: row.difficulty || row['Difficulty'],
    expected_answer: row.expected_answer || row['Expected Answer']
  };
}
