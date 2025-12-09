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
                     cp.cv_link,
                     s.schedule,
                     sc.soft_skill_score as soft_score,
                     sc.summary_desc as summary,
                     cp.created_date,cp.updated_date
              FROM candidate_profile cp
              INNER JOIN status st 
                ON cp.status = st.id
              INNER JOIN positions ps
                ON cp.position_id = ps.id
              LEFT JOIN summary_candidate sc
                ON cp.id = sc.candidate_id
                AND cp.position_id = sc.position_id
              LEFT JOIN schedule_user_interview s
                ON cp.id = s.candidate_id
                AND cp.position_id = s.position_id
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
    secure: true, 
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
    subject: `Application Status Update – ${level} ${position}`,
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


const sendScheduleEmail = async (
  email: string,
  name: string,
  level: string,
  position: string,
  googleMeetLink: string,
  schedule: string,
  ccUser: string,
  type: "create" | "update" = "create"
) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP configuration is missing. Please check your .env file.');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.verify();

  const ccManual = ["siska.andriani@bithealth.co.id"];
  const ccList = [
    ccUser,
    ...ccManual
  ].filter(Boolean);

  const formatToWIB = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    };

  let subject = "";
  let htmlBody = "";

  if (type === "create") {
    subject=    `Interview Schedule – ${level} ${position}`;
    htmlBody= `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <p>Dear <strong>${name}</strong>,</p>

      <p><strong>Congratulations!</strong></p>

      <p>
        We are pleased to inform you that you have progressed to the next stage 
        of our selection process for the 
        <strong>${level} ${position}</strong> position.
      </p>

      <p>Your interview details are as follows:</p>

      <div style="padding: 12px; background: #f3f3f3; border-radius: 8px;">
          <p><strong>Date & Time:</strong><br/>${formatToWIB(schedule)}</p>
          <p><strong>Google Meet Link:</strong><br/>
            <a href="${googleMeetLink}" target="_blank">${googleMeetLink}</a>
          </p>
      </div>

      <p>
        Please ensure your availability at the scheduled time.  
        Should you need to reschedule, kindly notify us as soon as possible.
      </p>

      <p>
        We look forward to speaking with you.<br/><br/>
        Best regards,<br/>
        <strong>HR Team</strong>
      </p>
    </div>
    `;
  }else if (type === "update") {
    subject= `Update Interview Schedule – ${level} ${position}`;
    htmlBody= `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <p>Dear <strong>${name}</strong>,</p>

        <p>We would like to inform you regarding rescheduling of your interview for the 
          <strong>${level} ${position}</strong> position.</p>

        <p>Update interview details are as follows:</p>

        <div style="padding: 12px; background: #f3f3f3; border-radius: 8px;">
            <p><strong>Date & Time:</strong><br/>${formatToWIB(schedule)}</p>
            <p><strong>Google Meet Link:</strong><br/>
              <a href="${googleMeetLink}" target="_blank">${googleMeetLink}</a>
            </p>
        </div>

        <p>
          Please make sure to be available at the scheduled time. If you need to reschedule, kindly notify us as soon as possible.
        </p>

        <p>
          We appreciate your confirmation and look forward to speaking with you.<br/><br/>
          Best regards,<br/>
          <strong>HR Team</strong>
        </p>
      </div>
    `;
  }

  const mailOptions = {
    from: `"HR Team" <${process.env.SMTP_USER}>`,
    to: email,
    cc: ccList.length > 0 ? ccList.join(", ") : undefined, 
    subject,
    html: htmlBody
  };
  await transporter.sendMail(mailOptions);
};

export const sendPassedCandidateEmail = async (
  hrEmail: string,   
  ccUser: string,       
  candidateName: string,
  level: string,
  position: string,
  feedback: string    
) => {
  // ✅ Validasi SMTP
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_PORT) {
    throw new Error('SMTP configuration is missing. Please check your .env file.');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log("SMTP Connected ✅");
  } catch (err) {
    console.error("SMTP Verification Failed ❌", err);
    throw err;
  }

  // CC manual
  const ccManual = [""];
  const ccList = [ccUser, ...ccManual].filter(Boolean);

  // Subject & HTML email
  const subject = `USER INTERVIEW FEEDBACK – ${candidateName} (${level} ${position})`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5;">
      <p>Dear HR Team,</p>

      <p>We would like to inform you that the candidate <strong>${candidateName}</strong> 
      for the <strong>${level} ${position}</strong> position has <strong> PASSED </strong> to the next stage of the selection process.</p>

      <p><strong>User Feedback:</strong></p>  
      <div style="padding: 10px; background: #f3f3f3; border-radius: 6px;">
        ${feedback}
      </div>

      <p>Please review and continue with the next steps of the recruitment process.</p>

      <p>Best regards,<br/><strong>User ${position}</strong></p>
    </div>
  `;

  const mailOptions = {
    from: `"HR Team" <${process.env.SMTP_USER}>`,
    to: hrEmail,
    cc: ccList.join(", "),
    subject,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("📨 Passed candidate email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Failed to send passed candidate email:", err);
    throw err;
  }
};

export const updateCandidateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newStatus,feedback } = req.body; // expected integer 2 | 3
    const newStatusNum = Number(newStatus);

    // Get current candidate info
    const result = await pool.query(
      `SELECT cp.status, cp.email, cp.name, ps.level, ps.position
       FROM candidate_profile cp
       INNER JOIN positions ps ON cp.position_id = ps.id
       WHERE cp.id = $1`,
      [id]
    );

    const scheduleRes = await pool.query(
      `SELECT schedule FROM schedule_user_interview WHERE candidate_id = $1`,
      [id]
    );
    const schedule = scheduleRes.rows[0]?.schedule;


    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    const candidate = result.rows[0];

    if (
      !(
        (candidate.status == 1 && [2, 3, 5].includes(newStatusNum)) ||
        (candidate.status == 5 && [3, 6].includes(newStatusNum))
      )
    ) {
      return res.status(400).json({
        error: `Invalid status transition from ${candidate.status} to ${newStatusNum}`
      });
    }

    if (![2, 3, 5, 6].includes(newStatusNum)) {
      return res.status(400).json({ error: "Invalid status. Must be 2 (Accepted) or 3 (Rejected)" });
    }

    if ([5, 6].includes(newStatusNum)) {
      const checkSchedule = await pool.query(
        `SELECT 1 FROM schedule_user_interview
        WHERE candidate_id = $1`,
        [id]
      );

      if (checkSchedule.rowCount === 0) {
        return res.status(400).json({
          error: "Interview schedule is required before setting this status"
        });
      }
    }

    const googleMeetLink = `https://meet.google.com/${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;

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
        
      }
    }

    // Send interview schedule email when status = 5
    if (newStatusNum === 5) {
      try {
        await sendScheduleEmail(
          candidate.email,
          candidate.name,
          candidate.level,
          candidate.position,
          googleMeetLink,
          schedule,
          req.user!.email,
          "create"
        );
        console.log(`📨 Schedule email sent to ${candidate.email}`);
      } catch (emailError: any) {
        console.error("❌ Failed to send schedule email:", emailError.message);
      }
    }


    if (newStatusNum === 6) {
      try {
        await sendPassedCandidateEmail(
          "siska.andriani@bithealth.co.id",
          req.user!.email,
          candidate.name,
          candidate.level,
          candidate.position,
          feedback
          
        );
        console.log(`📨 Schedule email sent to ${candidate.email}`);
      } catch (emailError: any) {
        console.error("❌ Failed to send schedule email:", emailError.message);
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



// USER DATA
export const getAllCandidatesUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, position, search, level,limit = '50', offset = '0' } = req.query;

    let query = `
              SELECT cp.id,cp.name,ps.level,ps.position,
                     cp.position_id,
                     cp.email,cp.residence,
                     cp.status AS status_id,
                     st.status AS status_label,
                     sc.soft_skill_score AS soft_score,
                     cp.cv_link,
                     sc.summary_desc AS summary,
                     ps.technical_link AS tech_link,
                     to_char(su.schedule, 'YYYY-MM-DD"T"HH24:MI') AS schedule,
                     cp.submit_date,
                     cp.created_date,cp.updated_date
              FROM candidate_profile cp
              INNER JOIN status st 
                ON cp.status = st.id
              INNER JOIN positions ps
                ON cp.position_id = ps.id
              INNER JOIN users u
                ON ps.position = u.position_name
                AND ps.id < u.position_id
              INNER JOIN summary_candidate sc
                ON cp.id = sc.candidate_id
                AND cp.position_id = sc.position_id
              LEFT JOIN schedule_user_interview su
                ON cp.id = su.candidate_id
                AND cp.position_id = su.position_id
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





export const getLatestInterviewHistory = async (req: Request, res: Response) => {
  try {
    const { candidate_id, position_id } = req.params;

    const query = `
      WITH latest_session AS (
        SELECT session_id
        FROM quick_call
        WHERE candidate_id = $1
          AND position_id = $2
        ORDER BY created_date DESC
        LIMIT 1
      )
      SELECT 
        ih.candidate_id,
        ih.position_id,
        ih.message AS chat_history,
        ih.created_date
      FROM quick_call ih
      JOIN latest_session ls ON ih.session_id = ls.session_id
      ORDER BY ih.created_date ASC;
    `;

    const result = await pool.query(query, [candidate_id, position_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No interview history found" });
    }

    res.status(200).json({
      success: true,
      session_id: result.rows[0].session_id,
      messages: result.rows
    });

  } catch (error) {
    console.error("Error getting interview history:", error);
    res.status(500).json({ error: "Failed to fetch interview history" });
  }
};



export const upsertSchedule = async (req: Request, res: Response): Promise<void> => {
  const { candidate_id, position_id, schedule } = req.body;

  // ✅ user_id dari backend (contoh dari middleware auth)
  const user_id = (req as any).user?.id;
  const userEmail = (req as any).user?.email;


  if (!candidate_id || !position_id || !schedule) {
    res.status(400).json({ error: "candidate_id, position_id, schedule are required" });
    return;
  }

  try {
    // ✅ Cek existing
    const checkQuery = `
      SELECT 1
      FROM schedule_user_interview
      WHERE candidate_id = $1 AND position_id = $2
    `;

    const checkResult = await pool.query(checkQuery, [candidate_id, position_id]);

    let result;

    if ((checkResult.rowCount ?? 0) > 0) {
      // ✅ UPDATE
      const updateQuery = `
        UPDATE schedule_user_interview
        SET schedule = $1,
            user_id = $2,
            updated_date = NOW()
        WHERE candidate_id = $3
          AND position_id = $4
        RETURNING *
      `;

      result = await pool.query(updateQuery, [
        schedule,
        user_id,
        candidate_id,
        position_id
      ]);

      const candidateRes = await pool.query(
        `SELECT cp.email, cp.name, ps.level, ps.position, cp.status
        FROM candidate_profile cp
        INNER JOIN positions ps ON cp.position_id = ps.id
        WHERE cp.id = $1`,
        [candidate_id]
      );
      const candidate = candidateRes.rows[0];

      const googleMeetLink = `https://meet.google.com/${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
      try {
        await sendScheduleEmail(
          candidate.email,
          candidate.name,
          candidate.level,
          candidate.position,
          googleMeetLink,
          schedule,
          userEmail,
          "update"
        );
        console.log(`📨 Schedule email sent to ${candidate.email}`);
      } catch (emailError: any) {
        console.error("❌ Failed to send schedule email:", emailError.message);
      }

      res.json({
        message: "Schedule updated successfully",
        data: result.rows[0]
      });

    } else {
      // ✅ INSERT
      const insertQuery = `
        INSERT INTO schedule_user_interview
        (candidate_id, position_id, schedule, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      result = await pool.query(insertQuery, [
        candidate_id,
        position_id,
        schedule,
        user_id
      ]);

      res.json({
        message: "Schedule created successfully",
        data: result.rows[0]
      });
    }

  } catch (error) {
    console.error("Schedule Error:", error);
    res.status(500).json({ error: "Failed to upsert schedule" });
  }
};
