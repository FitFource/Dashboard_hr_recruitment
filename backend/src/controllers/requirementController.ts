// import { Request, Response } from 'express';
// import pool from '../database/connection';
// import { JobRequirement } from '../types';
// import { AuthRequest } from '../middleware/auth';
// import csvParser from 'csv-parser';
// import xlsx from 'xlsx';
// import fs from 'fs';

// export const getAllRequirements = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { job_role, requirement_type, is_mandatory } = req.query;

//     let query = 'SELECT * FROM job_requirements WHERE 1=1';
//     const params: any[] = [];
//     let paramCount = 1;

//     if (job_role) {
//       query += ` AND job_role ILIKE $${paramCount}`;
//       params.push(`%${job_role}%`);
//       paramCount++;
//     }

//     if (requirement_type) {
//       query += ` AND requirement_type ILIKE $${paramCount}`;
//       params.push(`%${requirement_type}%`);
//       paramCount++;
//     }

//     if (is_mandatory !== undefined) {
//       query += ` AND is_mandatory = $${paramCount}`;
//       params.push(is_mandatory === 'true');
//       paramCount++;
//     }

//     query += ' ORDER BY created_at DESC';

//     const result = await pool.query<JobRequirement>(query, params);
//     res.json({ requirements: result.rows });
//   } catch (error) {
//     console.error('Error fetching requirements:', error);
//     res.status(500).json({ error: 'Failed to fetch requirements' });
//   }
// };

// export const createRequirement = async (req: AuthRequest, res: Response): Promise<void> => {
//   try {
//     const {
//       job_role,
//       requirement_type,
//       description,
//       is_mandatory = true,
//       minimum_years_experience,
//       required_skills,
//     } = req.body;

//     const result = await pool.query<JobRequirement>(
//       `INSERT INTO job_requirements (
//         job_role, requirement_type, description, is_mandatory, 
//         minimum_years_experience, required_skills, created_by
//       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
//       RETURNING *`,
//       [
//         job_role,
//         requirement_type,
//         description,
//         is_mandatory,
//         minimum_years_experience,
//         required_skills,
//         req.user?.id,
//       ]
//     );

//     res.status(201).json({ requirement: result.rows[0] });
//   } catch (error) {
//     console.error('Error creating requirement:', error);
//     res.status(500).json({ error: 'Failed to create requirement' });
//   }
// };

// export const uploadRequirements = async (req: AuthRequest, res: Response): Promise<void> => {
//   try {
//     if (!req.file) {
//       res.status(400).json({ error: 'No file uploaded' });
//       return;
//     }

//     const filePath = req.file.path;
//     const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
//     const requirements: any[] = [];

//     if (fileExtension === 'csv') {
//       // Parse CSV
//       await new Promise((resolve, reject) => {
//         fs.createReadStream(filePath)
//           .pipe(csvParser())
//           .on('data', (row) => {
//             requirements.push({
//               job_role: row.job_role || row['Job Role'],
//               requirement_type: row.requirement_type || row['Requirement Type'],
//               description: row.description || row['Description'],
//               is_mandatory: row.is_mandatory === 'true' || row['Is Mandatory'] === 'true',
//               minimum_years_experience: parseInt(row.minimum_years_experience || row['Minimum Years Experience']) || null,
//               required_skills: row.required_skills ? row.required_skills.split(',').map((s: string) => s.trim()) : null,
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
//         requirements.push({
//           job_role: row.job_role || row['Job Role'],
//           requirement_type: row.requirement_type || row['Requirement Type'],
//           description: row.description || row['Description'],
//           is_mandatory: row.is_mandatory === true || row['Is Mandatory'] === true,
//           minimum_years_experience: row.minimum_years_experience || row['Minimum Years Experience'] || null,
//           required_skills: row.required_skills ? 
//             (typeof row.required_skills === 'string' ? row.required_skills.split(',').map((s: string) => s.trim()) : row.required_skills) : null,
//         });
//       });
//     } else if (fileExtension === 'json') {
//       // Parse JSON
//       const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
//       requirements.push(...jsonData);
//     } else {
//       res.status(400).json({ error: 'Unsupported file format' });
//       return;
//     }

//     // Insert requirements into database
//     const insertedRequirements = [];
//     for (const r of requirements) {
//       if (r.job_role && r.requirement_type && r.description) {
//         const result = await pool.query<JobRequirement>(
//           `INSERT INTO job_requirements (
//             job_role, requirement_type, description, is_mandatory,
//             minimum_years_experience, required_skills, created_by
//           ) VALUES ($1, $2, $3, $4, $5, $6, $7)
//           RETURNING *`,
//           [
//             r.job_role,
//             r.requirement_type,
//             r.description,
//             r.is_mandatory !== undefined ? r.is_mandatory : true,
//             r.minimum_years_experience || null,
//             r.required_skills || null,
//             req.user?.id,
//           ]
//         );
//         insertedRequirements.push(result.rows[0]);
//       }
//     }

//     // Delete uploaded file
//     fs.unlinkSync(filePath);

//     res.status(201).json({
//       message: `Successfully uploaded ${insertedRequirements.length} requirements`,
//       requirements: insertedRequirements,
//     });
//   } catch (error) {
//     console.error('Error uploading requirements:', error);
//     res.status(500).json({ error: 'Failed to upload requirements' });
//   }
// };

// export const deleteRequirement = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { id } = req.params;

//     const result = await pool.query(
//       'DELETE FROM job_requirements WHERE id = $1 RETURNING id',
//       [id]
//     );

//     if (result.rows.length === 0) {
//       res.status(404).json({ error: 'Requirement not found' });
//       return;
//     }

//     res.json({ message: 'Requirement deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting requirement:', error);
//     res.status(500).json({ error: 'Failed to delete requirement' });
//   }
// };


import { Request, Response } from 'express';
import pool from '../database/connection';
import { JobRequirement } from '../types';
import { AuthRequest } from '../middleware/auth';
import csvParser from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';

// -----------------------------------------------------------
// Helper → Normalisasi Row
// -----------------------------------------------------------
function normalizeRequirement(row: any) {
  const parseBool = (val: any) => {
    if (val === undefined || val === null) return true;
    const str = String(val).toLowerCase();
    return ["true", "yes", "1"].includes(str);
  };

  const parseSkills = (val: any) => {
    if (!val) return null;
    if (Array.isArray(val)) return val;
    return String(val)
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const parseIntOrNull = (val: any) => {
    const num = parseInt(val);
    return isNaN(num) ? null : num;
  };

  return {
    job_role: row.job_role || row["Job Role"] || row["jobRole"],
    requirement_type: row.requirement_type || row["Requirement Type"],
    description: row.description || row["Description"],
    is_mandatory: parseBool(row.is_mandatory ?? row["Is Mandatory"]),
    minimum_years_experience:
      parseIntOrNull(row.minimum_years_experience ?? row["Minimum Years Experience"]),
    required_skills: parseSkills(row.required_skills ?? row["Required Skills"]),
  };
}

// -----------------------------------------------------------
// GET ALL REQUIREMENTS
// -----------------------------------------------------------
export const getAllRequirements = async (req: Request, res: Response) => {
  try {
    const { job_role, requirement_type, is_mandatory } = req.query;

    let query = "SELECT * FROM job_requirements WHERE 1=1";
    const params: any[] = [];
    let idx = 1;

    if (job_role) {
      query += ` AND job_role ILIKE $${idx}`;
      params.push(`%${job_role}%`);
      idx++;
    }

    if (requirement_type) {
      query += ` AND requirement_type ILIKE $${idx}`;
      params.push(`%${requirement_type}%`);
      idx++;
    }

    if (is_mandatory !== undefined) {
      query += ` AND is_mandatory = $${idx}`;
      params.push(is_mandatory === "true");
      idx++;
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query<JobRequirement>(query, params);
    res.json({ requirements: result.rows });
  } catch (error) {
    console.error("Error fetching requirements:", error);
    res.status(500).json({ error: "Failed to fetch requirements" });
  }
};

// -----------------------------------------------------------
// CREATE SINGLE REQUIREMENT
// -----------------------------------------------------------
export const createRequirement = async (req: AuthRequest, res: Response) => {
  try {
    const {
      job_role,
      requirement_type,
      description,
      is_mandatory = true,
      minimum_years_experience,
      required_skills,
    } = req.body;

    const createdBy = req.user?.id || null;

    const result = await pool.query<JobRequirement>(
      `INSERT INTO job_requirements (
        job_role, requirement_type, description, is_mandatory, 
        minimum_years_experience, required_skills, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        job_role,
        requirement_type,
        description,
        is_mandatory,
        minimum_years_experience || null,
        required_skills || null,
        createdBy,
      ]
    );

    res.status(201).json({ requirement: result.rows[0] });
  } catch (error) {
    console.error("Error creating requirement:", error);
    res.status(500).json({ error: "Failed to create requirement" });
  }
};

// -----------------------------------------------------------
// UPLOAD BULK REQUIREMENTS
// -----------------------------------------------------------
export const uploadRequirements = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const filePath = req.file.path;
    const ext = req.file.originalname.split(".").pop()?.toLowerCase();
    const requirements: any[] = [];

    // CSV
    if (ext === "csv") {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on("data", (row) => requirements.push(normalizeRequirement(row)))
          .on("end", resolve)
          .on("error", reject);
      });

      // Excel
    } else if (ext === "xlsx" || ext === "xls") {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.SheetNames[0];
      const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheet]);

      rows.forEach((row: any) => requirements.push(normalizeRequirement(row)));

      // JSON
    } else if (ext === "json") {
      const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      jsonData.forEach((row: any) => requirements.push(normalizeRequirement(row)));
    } else {
      res.status(400).json({ error: "Unsupported file format" });
      return;
    }

    const createdBy = req.user?.id || null;
    const inserted: JobRequirement[] = [];

    for (const r of requirements) {
      if (!r.job_role || !r.requirement_type || !r.description) continue;

      const result = await pool.query<JobRequirement>(
        `INSERT INTO job_requirements (
          job_role, requirement_type, description, is_mandatory,
          minimum_years_experience, required_skills, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          r.job_role,
          r.requirement_type,
          r.description,
          r.is_mandatory ?? true,
          r.minimum_years_experience,
          r.required_skills,
          createdBy,
        ]
      );

      inserted.push(result.rows[0]);
    }

    fs.unlinkSync(filePath);

    res.status(201).json({
      message: `Successfully uploaded ${inserted.length} requirements`,
      requirements: inserted,
    });
  } catch (error) {
    console.error("Error uploading requirements:", error);

    // Hapus file kalau ada error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: "Failed to upload requirements" });
  }
};

// -----------------------------------------------------------
// DELETE REQUIREMENT
// -----------------------------------------------------------
export const deleteRequirement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM job_requirements WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Requirement not found" });
      return;
    }

    res.json({ message: "Requirement deleted successfully" });
  } catch (error) {
    console.error("Error deleting requirement:", error);
    res.status(500).json({ error: "Failed to delete requirement" });
  }
};
