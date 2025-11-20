import { Request, Response } from 'express';
import pool from '../database/connection';
import { MetricsOverview, TopCandidate, CandidatesByRole } from '../types';

// export const getOverviewMetrics = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const result = await pool.query<MetricsOverview>(`
//       SELECT 
//         COUNT(*) as total_candidates,
//         COUNT(*) FILTER (WHERE status = 'accepted') as accepted_candidates,
//         COUNT(*) FILTER (WHERE status = 'rejected') as rejected_candidates,
//         COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_candidates
//       FROM candidates
//     `);

//     res.json(result.rows[0]);
//   } catch (error) {
//     console.error('Error fetching overview metrics:', error);
//     res.status(500).json({ error: 'Failed to fetch metrics' });
//   }
// };

// export const getTopCandidatesToday = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const result = await pool.query<TopCandidate>(`
//       SELECT 
//         c.id,
//         c.full_name,
//         c.email,
//         c.job_role,
//         c.status,
//         c.score,
//         COUNT(ch.id) as actions_count,
//         MAX(ch.created_at) as last_action_date
//       FROM candidates c
//       LEFT JOIN candidate_history ch ON c.id = ch.candidate_id
//       WHERE DATE(ch.created_at) = CURRENT_DATE
//       GROUP BY c.id, c.full_name, c.email, c.job_role, c.status, c.score
//       ORDER BY actions_count DESC, last_action_date DESC
//       LIMIT 10
//     `);

//     res.json(result.rows);
//   } catch (error) {
//     console.error('Error fetching top candidates:', error);
//     res.status(500).json({ error: 'Failed to fetch top candidates' });
//   }
// };

// export const getCandidatesByRole = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const result = await pool.query<CandidatesByRole>(`
//       SELECT 
//         job_role,
//         COUNT(*) as total_candidates,
//         COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
//         COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
//         COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress
//       FROM candidates
//       GROUP BY job_role
//       ORDER BY total_candidates DESC
//       LIMIT 10
//     `);

//     res.json(result.rows);
//   } catch (error) {
//     console.error('Error fetching candidates by role:', error);
//     res.status(500).json({ error: 'Failed to fetch candidates by role' });
//   }
// };

// export const getApplicationTrends = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { days = '30' } = req.query;

//     const result = await pool.query(`
//       SELECT 
//         DATE(applied_date) as date,
//         COUNT(*) as total_applications,
//         COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
//         COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
//         COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress
//       FROM candidates
//       WHERE applied_date >= CURRENT_DATE - INTERVAL '${parseInt(days as string)} days'
//       GROUP BY DATE(applied_date)
//       ORDER BY date DESC
//     `);

//     res.json(result.rows);
//   } catch (error) {
//     console.error('Error fetching application trends:', error);
//     res.status(500).json({ error: 'Failed to fetch application trends' });
//   }
// };


export const getOverviewMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) AS total_candidates,
        COUNT(*) FILTER (WHERE Status = 'accepted') AS accepted_candidates,
        COUNT(*) FILTER (WHERE Status = 'rejected') AS rejected_candidates,
        COUNT(*) FILTER (WHERE Status = 'in_progress') AS in_progress_candidates
      FROM Candidate_Profile
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching overview metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
};

// export const getTopCandidatesToday = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const result = await pool.query(`
//       SELECT 
//         c.id,
//         c.Name AS full_name,
//         c.Email,
//         c.Position AS job_role,
//         c.Status,
//         COUNT(ch.id) AS actions_count,
//         MAX(ch.created_at) AS last_action_date
//       FROM Candidate_Profile c
//       LEFT JOIN candidate_history ch ON c.id = ch.candidate_id
//       WHERE DATE(ch.created_at) = CURRENT_DATE
//       GROUP BY c.id, c.Name, c.Email, c.Position, c.Status
//       ORDER BY actions_count DESC, last_action_date DESC
//       LIMIT 10
//     `);

//     res.json(result.rows);
//   } catch (error) {
//     console.error("Error fetching top candidates:", error);
//     res.status(500).json({ error: "Failed to fetch top candidates" });
//   }
// };

export const getTopCandidatesToday = async (req: Request, res: Response) => {
  try {
    const { job_role, topN } = req.query;

    // default topN = 1 jika tidak diberikan
    const limit = topN ? parseInt(topN as string) : 1;

    const result = await pool.query(
      `
      SELECT *
      FROM (
          SELECT *,
                 ROW_NUMBER() OVER (PARTITION BY "position" ORDER BY "rank" ASC) AS rn
          FROM "summary_candidate"
          WHERE ($1::text IS NULL OR "position" = $1)
            AND DATE("updateddate") = CURRENT_DATE
      ) sub
      WHERE rn <= $2
      ORDER BY "position", "rank"
      `,
      [job_role || null, limit]
    );

    res.json({ topCandidates: result.rows });
  } catch (error) {
    console.error('Error fetching top candidates:', error);
    res.status(500).json({ error: 'Failed to fetch top candidates' });
  }
};

export const getCandidatesByRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        Position AS job_role,
        COUNT(*) AS total_candidates,
        COUNT(*) FILTER (WHERE Status = 'accepted') AS accepted,
        COUNT(*) FILTER (WHERE Status = 'rejected') AS rejected,
        COUNT(*) FILTER (WHERE Status = 'in_progress') AS in_progress
      FROM Candidate_Profile
      GROUP BY Position
      ORDER BY total_candidates DESC
      LIMIT 10
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching candidates by role:", error);
    res.status(500).json({ error: "Failed to fetch candidates by role" });
  }
};

export const getApplicationTrends = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = "30" } = req.query;

    const result = await pool.query(`
      SELECT 
        DATE(CreatedDate) AS date,
        COUNT(*) AS total_applications,
        COUNT(*) FILTER (WHERE Status = 'accepted') AS accepted,
        COUNT(*) FILTER (WHERE Status = 'rejected') AS rejected,
        COUNT(*) FILTER (WHERE Status = 'in_progress') AS in_progress
      FROM Candidate_Profile
      WHERE CreatedDate >= CURRENT_DATE - INTERVAL '${parseInt(days as string)} days'
      GROUP BY DATE(CreatedDate)
      ORDER BY date DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching application trends:", error);
    res.status(500).json({ error: "Failed to fetch application trends" });
  }
};
