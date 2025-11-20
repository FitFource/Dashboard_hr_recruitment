import { Request, Response } from 'express';
import pool from '../database/connection';
import { Candidate, CandidateHistory, CandidateDocument } from '../types';
import { AuthRequest } from '../middleware/auth';

// export const getAllCandidates = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { status, job_role, search, limit = '50', offset = '0' } = req.query;

//     let query = 'SELECT * FROM candidates WHERE 1=1';
//     const params: any[] = [];
//     let paramCount = 1;

//     if (status) {
//       query += ` AND status = $${paramCount}`;
//       params.push(status);
//       paramCount++;
//     }

//     if (job_role) {
//       query += ` AND job_role ILIKE $${paramCount}`;
//       params.push(`%${job_role}%`);
//       paramCount++;
//     }

//     if (search) {
//       query += ` AND (full_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
//       params.push(`%${search}%`);
//       paramCount++;
//     }

//     query += ` ORDER BY applied_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
//     params.push(limit, offset);

//     const result = await pool.query<Candidate>(query, params);

//     // Get total count
//     let countQuery = 'SELECT COUNT(*) FROM candidates WHERE 1=1';
//     const countParams: any[] = [];
//     let countParamIndex = 1;

//     if (status) {
//       countQuery += ` AND status = $${countParamIndex}`;
//       countParams.push(status);
//       countParamIndex++;
//     }

//     if (job_role) {
//       countQuery += ` AND job_role ILIKE $${countParamIndex}`;
//       countParams.push(`%${job_role}%`);
//       countParamIndex++;
//     }

//     if (search) {
//       countQuery += ` AND (full_name ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex})`;
//       countParams.push(`%${search}%`);
//     }

//     const countResult = await pool.query(countQuery, countParams);

//     res.json({
//       candidates: result.rows,
//       total: parseInt(countResult.rows[0].count),
//       limit: parseInt(limit as string),
//       offset: parseInt(offset as string),
//     });
//   } catch (error) {
//     console.error('Error fetching candidates:', error);
//     res.status(500).json({ error: 'Failed to fetch candidates' });
//   }
// };

// export const getCandidateById = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { id } = req.params;

//     const candidateResult = await pool.query<Candidate>(
//       'SELECT * FROM candidates WHERE id = $1',
//       [id]
//     );

//     if (candidateResult.rows.length === 0) {
//       res.status(404).json({ error: 'Candidate not found' });
//       return;
//     }

//     const historyResult = await pool.query<CandidateHistory>(
//       `SELECT ch.*, u.full_name as performed_by_name 
//        FROM candidate_history ch
//        LEFT JOIN users u ON ch.performed_by = u.id
//        WHERE ch.candidate_id = $1 
//        ORDER BY ch.created_at DESC`,
//       [id]
//     );

//     const documentsResult = await pool.query<CandidateDocument>(
//       'SELECT * FROM candidate_documents WHERE candidate_id = $1',
//       [id]
//     );

//     res.json({
//       candidate: candidateResult.rows[0],
//       history: historyResult.rows,
//       documents: documentsResult.rows,
//     });
//   } catch (error) {
//     console.error('Error fetching candidate:', error);
//     res.status(500).json({ error: 'Failed to fetch candidate details' });
//   }
// };

// export const createCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
//   try {
//     const {
//       full_name,
//       email,
//       phone,
//       job_role,
//       status = 'in_progress',
//       score,
//       resume_url,
//       linkedin_url,
//       years_of_experience,
//       skills,
//       education,
//       location,
//     } = req.body;

//     const result = await pool.query<Candidate>(
//       `INSERT INTO candidates (
//         full_name, email, phone, job_role, status, score, resume_url,
//         linkedin_url, years_of_experience, skills, education, location
//       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
//       RETURNING *`,
//       [
//         full_name,
//         email,
//         phone,
//         job_role,
//         status,
//         score,
//         resume_url,
//         linkedin_url,
//         years_of_experience,
//         skills,
//         education,
//         location,
//       ]
//     );

//     const candidate = result.rows[0];

//     // Add history entry
//     await pool.query(
//       `INSERT INTO candidate_history (candidate_id, action, description, performed_by, new_status)
//        VALUES ($1, $2, $3, $4, $5)`,
//       [
//         candidate.id,
//         'Created',
//         'Candidate profile created',
//         req.user?.id,
//         status,
//       ]
//     );

//     res.status(201).json({ candidate });
//   } catch (error: any) {
//     console.error('Error creating candidate:', error);
//     if (error.code === '23505') {
//       res.status(409).json({ error: 'Email already exists' });
//       return;
//     }
//     res.status(500).json({ error: 'Failed to create candidate' });
//   }
// };

// export const updateCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
//   try {
//     const { id } = req.params;
//     const updateFields = req.body;

//     // Get current candidate data
//     const currentResult = await pool.query<Candidate>(
//       'SELECT * FROM candidates WHERE id = $1',
//       [id]
//     );

//     if (currentResult.rows.length === 0) {
//       res.status(404).json({ error: 'Candidate not found' });
//       return;
//     }

//     const currentCandidate = currentResult.rows[0];

//     // Build dynamic update query
//     const fields = Object.keys(updateFields);
//     const values = Object.values(updateFields);
//     const setClause = fields
//       .map((field, index) => `${field} = $${index + 2}`)
//       .join(', ');

//     const result = await pool.query<Candidate>(
//       `UPDATE candidates SET ${setClause} WHERE id = $1 RETURNING *`,
//       [id, ...values]
//     );

//     const updatedCandidate = result.rows[0];

//     // Add history entry if status changed
//     if (updateFields.status && updateFields.status !== currentCandidate.status) {
//       await pool.query(
//         `INSERT INTO candidate_history (
//           candidate_id, action, description, performed_by, 
//           previous_status, new_status
//         ) VALUES ($1, $2, $3, $4, $5, $6)`,
//         [
//           id,
//           'Status Updated',
//           `Status changed from ${currentCandidate.status} to ${updateFields.status}`,
//           req.user?.id,
//           currentCandidate.status,
//           updateFields.status,
//         ]
//       );
//     }

//     res.json({ candidate: updatedCandidate });
//   } catch (error) {
//     console.error('Error updating candidate:', error);
//     res.status(500).json({ error: 'Failed to update candidate' });
//   }
// };

// export const deleteCandidate = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { id } = req.params;

//     const result = await pool.query('DELETE FROM candidates WHERE id = $1 RETURNING id', [id]);

//     if (result.rows.length === 0) {
//       res.status(404).json({ error: 'Candidate not found' });
//       return;
//     }

//     res.json({ message: 'Candidate deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting candidate:', error);
//     res.status(500).json({ error: 'Failed to delete candidate' });
//   }
// };


export const getAllCandidates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, job_role, search, limit = '50', offset = '0' } = req.query;

    let query = `SELECT * FROM Candidate_Profile WHERE 1=1`;
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      query += ` AND Status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (job_role) {
      query += ` AND Position ILIKE $${paramCount}`;
      params.push(`%${job_role}%`);
      paramCount++;
    }

    if (search) {
      query += ` AND (Name ILIKE $${paramCount} OR Email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY CreatedDate DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Count total
    let countQuery = `SELECT COUNT(*) FROM Candidate_Profile WHERE 1=1`;
    const countParams: any[] = [];
    let countIndex = 1;

    if (status) {
      countQuery += ` AND Status = $${countIndex}`;
      countParams.push(status);
      countIndex++;
    }

    if (job_role) {
      countQuery += ` AND Position ILIKE $${countIndex}`;
      countParams.push(`%${job_role}%`);
      countIndex++;
    }

    if (search) {
      countQuery += ` AND (Name ILIKE $${countIndex} OR Email ILIKE $${countIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      candidates: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
};

export const getCandidateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const candidateResult = await pool.query(
      `SELECT * FROM Candidate_Profile WHERE id = $1`,
      [id]
    );

    if (candidateResult.rows.length === 0) {
      res.status(404).json({ error: "Candidate not found" });
      return;
    }

    // History & documents optional
    const historyResult = await pool.query(
      `SELECT * FROM candidate_history WHERE candidate_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    const documentsResult = await pool.query(
      `SELECT * FROM candidate_documents WHERE candidate_id = $1`,
      [id]
    );

    res.json({
      candidate: candidateResult.rows[0],
      history: historyResult.rows,
      documents: documentsResult.rows,
    });

  } catch (error) {
    console.error("Error fetching candidate:", error);
    res.status(500).json({ error: "Failed to fetch candidate details" });
  }
};

export const createCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      Name,
      Email,
      Phone,
      Position,
      Gender,
      Summary_Profile,
      Education,
      Working_exp,
      Organization_exp,
      Portfolio,
      Hard_skill,
      Soft_skill,
      AI_reason,
      CV_link,
      Status = 'in_progress',
      Source,
      Residence,
      BirthDate
    } = req.body;

    const result = await pool.query(
      `INSERT INTO Candidate_Profile (
        Name, Email, Phone, Position, Gender, Summary_Profile, Education,
        Working_exp, Organization_exp, Portfolio, Hard_skill, Soft_skill,
        AI_reason, CV_link, Status, Source, Residence, BirthDate
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
      )
      RETURNING *`,
      [
        Name, Email, Phone, Position, Gender, Summary_Profile, Education,
        Working_exp, Organization_exp, Portfolio, Hard_skill, Soft_skill,
        AI_reason, CV_link, Status, Source, Residence, BirthDate
      ]
    );

    res.status(201).json({
      candidate: result.rows[0]
    });

  } catch (error: any) {
    console.error("Error creating candidate:", error);

    if (error.code === "23505") {
      res.status(409).json({ error: "Email already exists" });
      return;
    }

    res.status(500).json({ error: "Failed to create candidate" });
  }
};


export const updateCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    const current = await pool.query(
      `SELECT * FROM Candidate_Profile WHERE id = $1`,
      [id]
    );

    if (current.rows.length === 0) {
      res.status(404).json({ error: "Candidate not found" });
      return;
    }

    const fields = Object.keys(updateFields);
    const values = Object.values(updateFields);
    const setClause = fields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(', ');

    const result = await pool.query(
      `UPDATE Candidate_Profile SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    res.json({ candidate: result.rows[0] });

  } catch (error) {
    console.error("Error updating candidate:", error);
    res.status(500).json({ error: "Failed to update candidate" });
  }
};


export const deleteCandidate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM Candidate_Profile WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Candidate not found" });
      return;
    }

    res.json({ message: "Candidate deleted successfully" });

  } catch (error) {
    console.error("Error deleting candidate:", error);
    res.status(500).json({ error: "Failed to delete candidate" });
  }
};
