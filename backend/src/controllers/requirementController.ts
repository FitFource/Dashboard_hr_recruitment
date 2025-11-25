
import { Request, Response } from 'express';
import pool from '../database/connection';
import { JobRequirement } from '../types';
import { AuthRequest } from '../middleware/auth';
import csvParser from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';
import { spawn } from "child_process";


// -----------------------------------------------------------
// GET EMEBEDDING FOR REQUIREMENTS
// -----------------------------------------------------------
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


// -----------------------------------------------------------
// Helper → Normalisasi Row
// -----------------------------------------------------------
function normalizeRequirement(row: any) {
  return {
    position: row.position || row["Position"] || row["Job Role"],
    requirement: row.requirement || row["Requirement"] || row["Description"],
  };
}

// -----------------------------------------------------------
// GET ALL REQUIREMENTS
// -----------------------------------------------------------

export const getAllRequirements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { position } = req.query;

    let query = `
              SELECT 
                id, 
                position_level AS level,
                position_name AS position,
                requirements_text AS requirements,
                updated_date
              FROM job_requirements
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

    const result = await pool.query<JobRequirement>(query, params);
    res.json({ requirements: result.rows });

  } catch (error) {
    console.error('Error fetching requirements:', error);
    res.status(500).json({ error: 'Failed to fetch requirements' });
  }
};


// -----------------------------------------------------------
// CREATE SINGLE REQUIREMENT
// -----------------------------------------------------------
export const createRequirement = async (req: AuthRequest, res: Response) => {
  try {
    const { level, position, requirements } = req.body;

    if (!level || !position || !requirements) {
      return res.status(400).json({ error: "Level, position, and requirements are required" });
    }

    const posRes = await pool.query(
      `SELECT id FROM positions WHERE position=$1 AND level=$2`,
      [position, level]
    );

    if (posRes.rows.length === 0) {
      return res.status(400).json({ error: "Position not found for given level" });
    }

    const positionId = posRes.rows[0].id;

    const existingRequirements = await pool.query(
      `SELECT id FROM job_requirements 
       WHERE position_name=$1 AND position_level=$2`,
      [position, level]
    );

    // 3️⃣ Generate embedding untuk position & requirements
    const [positionVec, requirementsVec] = await getEmbedding([position, requirements]);

    // 4️⃣ Jika requirements sudah ada → UPDATE
    if (existingRequirements.rows.length > 0) {
      const updateRes = await pool.query(
        `UPDATE job_requirements
         SET requirements_text=$1,
             requirements_vector=$2,
             position_vector=$3,
             updated_date=NOW()
         WHERE id=$4
         RETURNING id, 
            position_id,
            position_level AS level,
            position_name AS position,
            position_vector,
            requirements_text AS requirements,
            requirements_vector,
            created_date,
            updated_date`,
        [requirements, requirementsVec, positionVec, existingRequirements.rows[0].id]
      );

      return res.json({ requirements: updateRes.rows[0] });
    }

    const insertRes = await pool.query(
      `INSERT INTO job_requirements
       (position_id, position_level, position_name, position_vector, requirements_text, requirements_vector, created_date, updated_date)
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
       RETURNING id, 
        position_id,
        position_level AS level,
        position_name AS position,
        position_vector,
        requirements_text AS requirements,
        requirements_vector,
        created_date,
        updated_date`,
      [positionId, level, position, positionVec, requirements, requirementsVec]
    );

    return res.status(201).json({ requirements: insertRes.rows[0] });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create/update requirements" });
  }
};



// -----------------------------------------------------------
// UPDATE  REQUIREMENT
// -----------------------------------------------------------
export const updateRequirement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { position, level, requirements } = req.body;

    // Only requirements required
    if (!requirements) {
      return res.status(400).json({ error: 'Description Requirements is required' });
    }

    // If no position/level → update requirements only
    if (!position || !level) {
      const result = await pool.query(
        `UPDATE job_requirements
         SET requirements_text=$1, updated_date=NOW()
         WHERE id=$2
         RETURNING id,
            position_level AS level,
            position_name AS position,
            requirements_text AS requirements,
            created_date,
            updated_date`,
        [requirements, id]
      );

      if (!result.rows.length)
        return res.status(404).json({ error: 'Requirements not found' });

      return res.json({ requirements: result.rows[0] });
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
    let positionVec = posRes.rows[0].position_vector;

    if (!positionVec || positionVec.length === 0) {
      [positionVec] = await getEmbedding([position]);
      await pool.query(
        `UPDATE positions SET position_vector=$1, update_date=NOW() WHERE id=$2`,
        [positionVec, positionId]
      );
    }

    const [, requirementsVec] = await getEmbedding([requirements]);

    const result = await pool.query(
      `UPDATE job_requirements
       SET position_id=$1, position_level=$2, position_name=$3, position_vector=$4,
           requirements_text=$5, requirements_vector=$6, updated_date=NOW()
       WHERE id=$7
       RETURNING id, 
          position_id,
          position_level AS level,
          position_name AS position,
          position_vector,
          requirements_text AS requirements,
          requirements_vector,
          created_date,
          updated_date`,
      [positionId, level, position, positionVec, requirements, requirementsVec, id]
    );

    if (!result.rows.length)
      return res.status(404).json({ error: 'Requirements not found' });

    res.json({ requirements: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update requirements' });
  }
};



// -----------------------------------------------------------
// DELETE REQUIREMENT
// -----------------------------------------------------------
export const deleteRequirement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM job_requirements WHERE id = $1 RETURNING id", [
      id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Requirement not found" });
    }

    res.json({ message: "Requirement deleted successfully" });
  } catch (error) {
    console.error("Error deleting requirement:", error);
    res.status(500).json({ error: "Failed to delete requirement" });
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