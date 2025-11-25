import { Request, Response } from 'express';
import pool from '../database/connection';
import { Candidate} from '../types';
import { AuthRequest } from '../middleware/auth';
import nodemailer from 'nodemailer';

export const getAllCandidates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, position, search, level,limit = '50', offset = '0' } = req.query;

    let query = `
              SELECT cp.id,cp.name,ps.level,ps.position,
                     cp.email,cp.residence,
                     cp.status AS status_id,
                     st.status AS status_label,
                     sc.avg_score AS score, sc.rank,
                     cp.created_date,cp.updated_date
              FROM candidate_profile cp
              INNER JOIN status st 
                ON cp.status = st.id
              INNER JOIN positions ps
                ON cp.position_id = ps.id
              LEFT JOIN summary_candidate sc
                ON cp.id = sc.candidate_id
                AND cp.position_id = sc.position_id
              WHERE 1=1
            `;
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      query += ` AND st.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (position) {
      query += ` AND ps.position ILIKE $${paramCount}`;
      params.push(`%${position}%`);
      paramCount++;
    }

    if (search) {
      query += ` AND (cp.name ILIKE $${paramCount} OR cp.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (level) {
      query += ` AND ps.level = $${paramCount}`;
      params.push(level);
      paramCount++;
    }

    query += ` ORDER BY cp.name ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      candidates: result.rows,
      total: result.rows.length,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
};


export const getDistinctPositions = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT DISTINCT b.position
                                      FROM Candidate_Profile a
                                      INNER JOIN positions b 
                                        ON a.Position_Id = b.id
                                      ORDER BY Position`);
    const positions = result.rows.map(row => row.position); // pastikan sesuai casing di DB
    res.json({ positions });
  } catch (error) {
    console.error("Error fetching distinct positions:", error);
    res.status(500).json({ error: "Failed to fetch positions" });
  }
};


const sendRejectionEmail = async (
  email: string,
  name: string,
  level: string,
  position: string
) => {
  // Validate SMTP configuration
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP configuration is missing. Please check your .env file.');
  }
  
  console.log("ENV:", process.env.SMTP_HOST, process.env.SMTP_USER);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Verify SMTP connection
  try {
    await transporter.verify();
  } catch (error) {
    console.error('SMTP connection failed:', error);
    throw new Error('Failed to connect to email server. Please check SMTP credentials.');
  }

  const mailOptions = {
    from: `"HR Team" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Application Status Update – ${position} (${level})`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
        <p>Dear <strong>${name}</strong>,</p>
        <p>Thank you for your interest in the <strong>${level} ${position}</strong> position at our company.</p>
        <p>After careful consideration, we regret to inform you that your application for the <strong> ${level} ${position} </strong> role has not been successful at this time.</p>
        <p>We truly appreciate the time and effort you put into your application, and we encourage you to apply for other opportunities that match your skills in the future.</p>
        <p>Wishing you success in your career.</p>
        <p>Best regards,<br/>
        <strong>HR Team</strong></p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};


export const updateCandidateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newStatus } = req.body; // expected integer 2 | 3
    const newStatusNum = Number(newStatus);

    // Get current candidate info
    const result = await pool.query(
      `SELECT cp.status, cp.email, cp.name, ps.level, ps.position
       FROM candidate_profile cp
       INNER JOIN positions ps ON cp.position_id = ps.id
       WHERE cp.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    const candidate = result.rows[0];

    // Only allow status change if current status is 1 (In Progress/Open)
    if (Number(candidate.status) !== 1) {
      return res.status(400).json({ error: "Can only update 'In Progress' candidates" });
    }

    // Validate new status
    if (![2, 3].includes(newStatusNum)) {
      return res.status(400).json({ error: "Invalid status. Must be 2 (Accepted) or 3 (Rejected)" });
    }

    // Update status
    const updateResult = await pool.query(
      `UPDATE candidate_profile
       SET status = $1, updated_date = NOW()
       WHERE id = $2
       RETURNING id, status`,
      [newStatusNum, id]
    );

    // Send rejection email if status is Rejected
    if (newStatusNum === 3) {
      try {
        await sendRejectionEmail(
          candidate.email, 
          candidate.name, 
          candidate.level, 
          candidate.position
        );
        console.log(`✅ Rejection email sent successfully to ${candidate.email}`);
      } catch (emailError: any) {
        console.error('❌ Failed to send rejection email:', emailError.message);
        console.error('Full error:', emailError);
        
        // Log specific error for SMTP authentication issues
        if (emailError.code === 'EAUTH') {
          console.error('');
          console.error('⚠️  SMTP Authentication Failed!');
          console.error('Please check:');
          console.error('1. SMTP_USER and SMTP_PASS are set in .env file');
          console.error('2. If using Gmail, you need to use App Password (not regular password)');
          console.error('3. See GMAIL_SMTP_SETUP.md for detailed setup instructions');
          console.error('');
        }
        
        // Don't fail the request if email fails - status update should still succeed
      }
    }


    res.json({
      candidate: updateResult.rows[0],
      message: "Candidate status updated successfully"
    });

  } catch (error) {
    console.error("Error updating candidate status:", error);
    res.status(500).json({ error: "Failed to update candidate status" });
  }
};



