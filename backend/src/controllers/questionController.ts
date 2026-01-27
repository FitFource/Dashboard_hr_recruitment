


import { Request, Response } from 'express';
import pool from '../database/connection';
import { InterviewQuestion } from '../types';
import { AuthRequest } from '../middleware/auth';
import { spawn } from 'child_process';

// ---------------------------------------------------------------------------
// GET EMEBEDDING FOR QUESTIONS
// ---------------------------------------------------------------------------
const getEmbedding = (texts: string[]): Promise<number[][]> => {
  return new Promise((resolve, reject) => {
    const py = spawn('python', ['embed.py', JSON.stringify(texts)]);
    let output = '';
    let error = '';

    py.stdout.on('data', (data) => output += data.toString());
    py.stderr.on('data', (data) => error += data.toString());

    py.on('close', (code) => {
      if (code !== 0) return reject(new Error(error));
      resolve(JSON.parse(output));
    });
  });
};

function vectorToPgArray(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

// ---------------------------------------------------------------------------
// GET ALL QUESTIONS
// ---------------------------------------------------------------------------
export const getAllQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { position } = req.query;

    let query = `
              SELECT 
                id, 
                position_level AS level,
                position_name AS position,
                question_text AS question,
                updated_date
              FROM interview_questions 
              WHERE 1 = 1
              `;

    const params: any[] = [];
    let idx = 1;

    if (position) {
      query += ` AND position_name ILIKE $${idx}`;
      params.push(`%${position}%`);
      idx++;
    }

    query += ' ORDER BY updated_date DESC';

    const result = await pool.query<InterviewQuestion>(query, params);
    res.json({ questions: result.rows });

  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};


export const createQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { level, position, question } = req.body;

    if (!level || !position || !question) {
      return res.status(400).json({ error: "Level, position, and question are required" });
    }

    const posRes = await pool.query(
      `SELECT id FROM positions WHERE position=$1 AND level=$2`,
      [position, level]
    );

    if (posRes.rows.length === 0) {
      return res.status(400).json({ error: "Position not found for given level" });
    }

    const positionId = posRes.rows[0].id;

    const existingQuestion = await pool.query(
      `SELECT id FROM interview_questions 
       WHERE position_name=$1 AND position_level=$2`,
      [position, level]
    );

    // 3️⃣ Generate embedding untuk position & question
    // const [positionVec, questionVec] = await getEmbedding([position, question]);

    // 4️⃣ Jika question sudah ada → UPDATE
    if (existingQuestion.rows.length > 0) {
      const updateRes = await pool.query(
        `UPDATE interview_questions
         SET question_text=$1,
             updated_date=NOW()
         WHERE id=$2
         RETURNING id, 
            question_text AS question,
            updated_date`,
        [question, existingQuestion.rows[0].id]
      );

      return res.json({ question: updateRes.rows[0] });
    }

    const insertRes = await pool.query(
      `INSERT INTO interview_questions
       (position_id, position_level, position_name, question_text, created_date, updated_date)
       VALUES ($1,$2,$3,$4,NOW(),NOW())
       RETURNING id, 
        position_id,
        position_level AS level,
        position_name AS position,
        question_text AS question,
        created_date,
        updated_date`,
      [positionId, level, position, question]
    );

    return res.status(201).json({ question: insertRes.rows[0] });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create/update question" });
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


export const updateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { position, level, question } = req.body;
    // const [questionVec] = await getEmbedding([question]);

    // Only question required
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // If no position/level → update question only
    if (!position || !level) {
      const result = await pool.query(
        `UPDATE interview_questions
         SET question_text=$1,updated_date=NOW()
         WHERE id=$2
         RETURNING id,
            position_level AS level,
            position_name AS position,
            question_text AS question,
            created_date,
            updated_date`,
        [question, id]
      );

      if (!result.rows.length)
        return res.status(404).json({ error: 'Question not found' });

      return res.json({ question: result.rows[0] });
    }

    // ----- Full update with embedding (for later use) -----
    let posRes = await pool.query(
      `SELECT id, position_vector FROM positions WHERE position=$1 AND level=$2`,
      [position, level]
    );

    if (posRes.rows.length === 0) {
      return res.status(400).json({ error: 'Position not found for given level' });
    }

    let positionId = posRes.rows[0].id;
    // let positionVec = posRes.rows[0].position_vector;

    // if (!positionVec || positionVec.length === 0) {
    //   [positionVec] = await getEmbedding([position]);
    //   await pool.query(
    //     `UPDATE positions SET position_vector=$1::vector, update_date=NOW() WHERE id=$2`,
    //     [vectorToPgArray(positionVec), positionId]
    //   );
    // }

  

    const result = await pool.query(
      `UPDATE interview_questions
       SET position_id=$1, position_level=$2, position_name=$3,
           question_text=$4, updated_date=NOW()
       WHERE id=$5
       RETURNING id, 
          position_id,
          position_level AS level,
          position_name AS position,
          question_text AS question,
          created_date,
          updated_date`,
      [positionId, level, position, question, id]
    );

    if (!result.rows.length)
      return res.status(404).json({ error: 'Question not found' });

    res.json({ question: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update question' });
  }
};



export const getPositionsList = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT level, position 
      FROM positions 
      ORDER BY level, position
    `);

    res.json(result.rows);  // Frontend expects array
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch positions" });
  }
};

// ------------------------------------------------------
// NORMALIZER FUNCTION
// ------------------------------------------------------
function normalizeRow(row: any) {
  return {
    position: row.position || row['position'] || row['position'],
    question: row.question || row['Question'] || row['QUESTION']
  };
}

