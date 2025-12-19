import { Request, Response } from 'express';
import pool from '../database/connection';
import { MetricsOverview, TopCandidate, CandidatesByRole } from '../types';

export const getOverviewMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { job_role, level, start_date, end_date } = req.query;

    const result = await pool.query(`
      SELECT 
        COUNT(*) AS total_candidates,
        COUNT(*) FILTER (WHERE a.status = 2) AS accepted_candidates,
        COUNT(*) FILTER (WHERE a.status in (3,7)) AS rejected_candidates,
        COUNT(*) FILTER (WHERE a.status in (1,5,6)) AS in_progress_candidates
      FROM candidate_profile a
      INNER JOIN positions p ON a.position_id = p.id
      WHERE ($1::text IS NULL OR p.position = $1)
        AND ($2::text IS NULL OR p.level = $2)
        AND ($3::date IS NULL OR a.submit_date >= $3)
        AND ($4::date IS NULL OR a.submit_date <= $4)
    `, [job_role || null, level || null, start_date || null, end_date || null]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching overview metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
};


export const getTopCandidatesToday = async (req: Request, res: Response) => {
  try {
    const { job_role, level, topN, start_date, end_date } = req.query;
    const limit = topN ? parseInt(topN as string) : 10;

    const result = await pool.query(
      `
      SELECT
            cp.id,
            c.name,
            c.email,
            p.level,
            p.position AS job_role,
            s.status,
            cp.curt,
            cp.nervous,
            cp.calmness,
            cp.confident,
            cp.enthusiast,
            s.status,
            c.submit_date,
            cp.updated_date AS last_action_date
      FROM summary_candidate cp
      INNER JOIN candidate_profile c
        ON cp.candidate_id = c.id
        AND cp.position_id = c.position_id
      INNER JOIN positions p
        ON cp.position_id = p.id
      INNER JOIN status s
        ON c.status = s.id
      WHERE c.status in (1,5,6)
        AND ($1::text IS NULL OR p.position = $1)
        AND ($2::text IS NULL OR p.level = $2)
        AND ($3::date IS NULL OR c.submit_date >= $3)
        AND ($4::date IS NULL OR c.submit_date <= $4)
      ORDER BY c.status DESC
      LIMIT $5
      `,
      [job_role || null, level || null, start_date || null, end_date || null, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching top candidates:', error);
    res.status(500).json({ error: 'Failed to fetch top candidates' });
  }
};



export const getCandidatesByRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { job_role, start_date, end_date, level } = req.query;
    const result = await pool.query(`
      SELECT 
        p.position AS job_role,
        COUNT(*) AS total_candidates,
        COUNT(*) FILTER (WHERE a.status = 2) AS accepted,
        COUNT(*) FILTER (WHERE a.status in (3,7)) AS rejected,
        COUNT(*) FILTER (WHERE a.Status in(1,5,6)) AS in_progress
      FROM candidate_profile a
      INNER JOIN positions p
        ON a.position_id = p.id
      WHERE ($1::text IS NULL OR p.position = $1)
        AND ($2::date IS NULL OR a.submit_date >= $2)
        AND ($3::date IS NULL OR a.submit_date <= $3)
        AND ($4::text IS NULL OR p.level = $4)
      GROUP BY p.position
      ORDER BY total_candidates DESC
    `,
      [job_role || null,start_date || null,end_date || null,level || null
      ]);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching candidates by role:", error);
    res.status(500).json({ error: "Failed to fetch candidates by role" });
  }
};

export const getApplicationTrends = async (req: Request, res: Response): Promise<void> => {
  try {
    const { job_role, level, start_date, end_date ,days = "30" } = req.query;

    const result = await pool.query(`
      SELECT 
        DATE(a.submit_date) AS date,
        COUNT(*) AS total_applications,
        COUNT(*) FILTER (WHERE a.status = 2) AS accepted,
        COUNT(*) FILTER (WHERE a.status in (3,7)) AS rejected,
        COUNT(*) FILTER (WHERE a.status in(1,5,6)) AS in_progress
      FROM candidate_profile a
      INNER JOIN positions p ON a.position_id = p.id
      WHERE 
        -- gunakan start/end date jika ada, kalau tidak pakai interval default
        (COALESCE($1::date, a.submit_date) <= a.submit_date AND COALESCE($2::date, a.submit_date) >= a.submit_date)
        AND ($3::text IS NULL OR p.position = $3)
        AND ($4::text IS NULL OR p.level = $4)
        AND (COALESCE($1::date, CURRENT_DATE - INTERVAL '${parseInt(days as string)} days') <= a.submit_date)
      GROUP BY DATE(a.submit_date)
      ORDER BY date DESC
    `, [start_date || null, end_date || null, job_role || null, level || null]);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching application trends:", error);
    res.status(500).json({ error: "Failed to fetch application trends" });
  }
};

export const getLevels = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT DISTINCT level FROM positions ORDER BY level`);
    res.json({ levels: result.rows.map(r => r.level) });
  } catch (error) {
    console.error("Error fetching levels:", error);
    res.status(500).json({ error: "Failed to fetch levels" });
  }
};


// USER DATA

export const getMetricsUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { job_role, level, start_date, end_date } = req.query;

    const result = await pool.query(`
      SELECT 
        COUNT(*) AS total_candidates,
        COUNT(*) FILTER (WHERE a.status = 2) AS accepted_candidates,
        COUNT(*) FILTER (WHERE a.status in (3,7)) AS rejected_candidates,
        COUNT(*) FILTER (WHERE a.status in(1,5,6)) AS in_progress_candidates
      FROM candidate_profile a
      INNER JOIN positions p ON a.position_id = p.id
      INNER JOIN users b 
        ON p.position = b.position_name 
        AND p.id < b.position_id
      WHERE ($1::text IS NULL OR p.position = $1)
        AND ($2::text IS NULL OR p.level = $2)
        AND ($3::date IS NULL OR a.submit_date >= $3)
        AND ($4::date IS NULL OR a.submit_date <= $4)
    `, [job_role || null, level || null, start_date || null, end_date || null]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching overview metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
};



export const getNextInterview = async (req: Request, res: Response): Promise<void> => {
  try {
    const userID = (req as any).user?.id;

    const result = await pool.query(`
      SELECT 
        s.schedule AS interview_time,
        'https://teams.live.com/meet/9324593924800?p=OJpmepJhCWJ9wnvm9n' as meeting_link,
        c.name AS candidate_name,
        p.position AS position_name,
        p.level
      FROM schedule_user_interview s
      INNER JOIN candidate_profile c 
        ON s.candidate_id = c.id
      INNER JOIN positions p 
        ON c.position_id = p.id
      INNER JOIN users b 
        ON p.position = b.position_name 
        AND p.id < b.position_id
      WHERE s.user_id = $1
        AND s.schedule >= NOW()
      ORDER BY s.schedule ASC
      LIMIT 5;
    `, [userID]);

    res.json({ next: result.rows });
  } catch (error) {
    console.error("Error fetching next interview:", error);
    res.status(500).json({ error: "Failed to fetch next interview" });
  }
};
