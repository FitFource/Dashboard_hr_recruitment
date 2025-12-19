import { Request, Response } from 'express';
import pool from '../database/connection';
import { Candidate} from '../types';
import { AuthRequest } from '../middleware/auth';
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true, 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });


export const getAllCandidates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, position, search, level,limit = '50', offset = '0' } = req.query;

    let query = `
              SELECT cp.id,cp.name,ps.level,ps.position,cp.position_id,
                     cp.email,cp.residence,
                     cp.status AS status_id,
                     st.status AS status_label,
                     cp.cv_link,
                    to_char(s.schedule, 'YYYY-MM-DD"T"HH24:MI') AS schedule,
                     sc.curt,
                     sc.nervous,
                     sc.calmness,
                     sc.confident,
                     sc.enthusiast,
                     cp.technical_link as tech_link,
                     sc.summary_desc as summary,
                     cp.phone_number,
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


// ------------------------
// TEMPLATE EMAIL //
// ------------------------

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

  const mailOptions = {
    from: `"HR Team" <${process.env.SMTP_USER}>`,
    to: email,
    cc:'hrviewer8@gmail.com',
    subject: `Application Status Update – ${level} ${position}`,
    html: `
      <div style="background-color: #f3f4f6; padding: 40px 16px; font-family: 'Segoe UI', Arial, sans-serif;">
        <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <!-- Header / Logo -->
          <div style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb; text-align: center; background-color: #ffffff;">
            <img src="cid:bithealthlogo" alt="BitHealth Logo" width="350" style="display:block; margin:0 auto;"/>
          </div>

          <!-- Content -->
          <div style="padding: 32px; color: #2b2b2b; line-height: 1.7;">
            <p>Dear <strong>${name}</strong>,</p>

            <p>Thank you for your interest in the <strong>${level} ${position}</strong> position at 
              <strong>BitHealth</strong>, and for taking the time to participate in our recruitment process.</p>

            <p style="font-weight: 600; color: #1f2937;">
              After careful consideration, we regret to inform you that your application for the 
              <strong>${level} ${position}</strong> role will not be progressed further at this stage.
            </p>

            <p>We appreciate the time and effort you invested in the selection process. 
              This decision was made after careful evaluation, as we received applications from many qualified candidates.</p>

            <p>We encourage you to consider future opportunities at BitHealth that may better align with your experience and qualifications.</p>

            <p>We wish you continued success in your professional endeavors.</p>

            <p>Kind regards,<br/>
              <strong>Human Resources Team</strong><br/>
              <span style="color: #6b7280;">BitHealth</span>
            </p>
          </div>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: 'logo_bithealth.png',
        path: './logo_bithealth.png',
        cid: 'bithealthlogo', 
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};


const sendScheduleEmail = async (
  email: string,
  name: string,
  level: string,
  position: string,
  schedule: string,
  ccUser: string,
  type: "create" | "update" = "create"
) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP configuration is missing. Please check your .env file.');
  }


  const ccManual = ["hrviewer8@gmail.com"];
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
    htmlBody = `
      <div style="background-color: #f3f4f6; padding: 40px 16px; font-family: 'Segoe UI', Arial, sans-serif;">
        <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

          <!-- Header / Logo -->
          <div style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb; text-align: center; background-color: #ffffff;">
            <img src="cid:bithealthlogo" alt="BitHealth Logo" width="350" style="display:block; margin:0 auto;"/>
          </div>

          <!-- Content -->
          <div style="padding: 32px; color: #1f2937; line-height: 1.7;">
            <p style="font-size: 16px;">Dear <strong>${name}</strong>,</p>

            <p style="font-size: 18px; font-weight: 600; color: #111827; margin-top: 16px;">
              🎉 Congratulations!
            </p>

            <p style="font-size: 16px; margin-top: 12px;">
              We are excited to inform you that you have progressed to the next stage 
              of our selection process for the 
              <strong>${level} ${position}</strong> position at <strong>BitHealth</strong>.
            </p>

            <p style="font-size: 16px; margin-top: 12px;">Your interview details are as follows:</p>

            <div style="padding: 24px; background: #eef2ff; border-radius: 12px; margin-top: 16px; border: 1px solid #c7d2fe; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
              <p style="margin: 8px 0; font-size: 16px;">
                <strong>📅 Date & Time:</strong><br/>
                ${formatToWIB(schedule)}
              </p>
              <p style="margin: 8px 0; font-size: 16px;">
                <strong>🔗 Google Meet Link:</strong><br/>
                <a href="https://teams.live.com/meet/9324593924800?p=OJpmepJhCWJ9wnvm9n" target="_blank" style="color: #4f46e5; text-decoration: none; font-weight: 500;">Join Meeting</a>
              </p>
              <p style="margin: 8px 0; font-size: 16px;">
                <strong>🆔 Meeting ID:</strong> 932 459 392 480 0<br/>
                <strong>Passcode:</strong> 9pK98F
              </p>
            </div>


            <p style="margin-top: 16px; font-size: 16px;">
              Please ensure your availability at the scheduled time.  
              Should you need to reschedule, kindly notify us as soon as possible.<br>
              📱WhatsApp:
            <a
              href="https://wa.me/625117700307"
              target="_blank"
              style="color:#25D366; text-decoration: underline; font-weight: 500;"
            >
              0812-3456-7890
            </a>
            </p>


            <p style="margin-top: 24px; font-size: 16px;">
              We look forward to speaking with you.<br/><br/>
              Best regards,<br/>
              <strong>Human Resources Team</strong><br/>
              <span style="color: #6b7280;">BitHealth</span>
            </p>
          </div>
        </div>
      </div>
      `;

  }else if (type === "update") {
    subject= `Update Interview Schedule – ${level} ${position}`;
    htmlBody = `
      <div style="background-color: #f3f4f6; padding: 40px 16px; font-family: 'Segoe UI', Arial, sans-serif;">
        <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

          <!-- Header / Logo -->
          <div style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb; text-align: center; background-color: #ffffff;">
            <img src="cid:bithealthlogo" alt="BitHealth Logo" width="350" style="display:block; margin:0 auto;"/>
          </div>

          <!-- Content -->
          <div style="padding: 32px; color: #1f2937; line-height: 1.7;">
            <p style="font-size: 16px;">Dear <strong>${name}</strong>,</p>

            <p style="font-size: 18px; font-weight: 600; color: #111827; margin-top: 16px;">
              🔄 Interview Rescheduled
            </p>

            <p style="font-size: 16px; margin-top: 12px;">
              We would like to inform you regarding the rescheduling of your interview for the 
              <strong>${level} ${position}</strong> position at <strong>BitHealth</strong>.
            </p>

            <p style="font-size: 16px; margin-top: 12px;">Updated interview details are as follows:</p>

            <div style="padding: 24px; background: #eef2ff; border-radius: 12px; margin-top: 16px; border: 1px solid #c7d2fe; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
              <p style="margin: 8px 0; font-size: 16px;">
                <strong>📅 Date & Time:</strong><br/>
                ${formatToWIB(schedule)}
              </p>
              <p style="margin: 8px 0; font-size: 16px;">
                <strong>🔗 Google Meet Link:</strong><br/>
                <a href="https://teams.live.com/meet/9324593924800?p=OJpmepJhCWJ9wnvm9n" target="_blank" style="color: #4f46e5; text-decoration: none; font-weight: 500;">Join Meeting</a>
              </p>
              <p style="margin: 8px 0; font-size: 16px;">
                <strong>🆔 Meeting ID:</strong> 932 459 392 480 0<br/>
                <strong>Passcode:</strong> 9pK98F
              </p>
            </div>

            <p style="margin-top: 16px; font-size: 16px;">
              Please ensure your availability at the scheduled time. If you need to reschedule, kindly notify us as soon as possible. <br>
              📱WhatsApp:
            <a
              href="https://wa.me/625117700307"
              target="_blank"
              style="color:#25D366; text-decoration: underline; font-weight: 500;"
            >
              0812-3456-7890
            </a>
            </p>

            <p style="margin-top: 24px; font-size: 16px;">
              We appreciate your confirmation and look forward to speaking with you.<br/><br/>
              Best regards,<br/>
              <strong>Human Resources Team</strong><br/>
              <span style="color: #6b7280;">BitHealth</span>
            </p>
          </div>
        </div>
      </div>
      `;
  }

  const mailOptions = {
    from: `"HR Team" <${process.env.SMTP_USER}>`,
    to: email,
    cc: ccList.length > 0 ? ccList.join(", ") : undefined, 
    subject,
    html: htmlBody,
    attachments: [
      {
        filename: 'logo_bithealth.png',
        path: './logo_bithealth.png',
        cid: 'bithealthlogo', 
      },
    ],
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
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_PORT) {
    throw new Error('SMTP configuration is missing. Please check your .env file.');
  }


  // CC manual
  const ccManual = ["hrviewer8@gmail.com"];
  const ccList = [ccUser, ...ccManual].filter(Boolean);

  // Subject & HTML email
  const subject = `USER INTERVIEW FEEDBACK – ${candidateName} (${level} ${position})`;
  const html = `
    <div style="background-color: #f3f4f6; padding: 40px 16px; font-family: 'Segoe UI', Arial, sans-serif;">
      <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">

        <!-- Header -->
        <div style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <img src="cid:bithealthlogo" alt="BitHealth Logo" width="350" style="display:block; margin:0 auto;"/>
        </div>

        <!-- Content -->
        <div style="padding: 32px; color: #1f2937; line-height: 1.7;">
          <p style="font-size: 16px;">Dear HR Team,</p>

          <p style="font-size: 16px; margin-top: 12px;">
            We would like to inform you that the candidate <strong>${candidateName}</strong> 
            for the <strong>${level} ${position}</strong> position has <strong>✅ PASSED</strong> to the next stage of the selection process.
          </p>

          <p style="font-size: 16px; margin-top: 12px;"><strong>User Feedback:</strong></p>  
          <div style="padding: 16px; background: #eef2ff; border-radius: 10px; border: 1px solid #c7d2fe; font-size: 15px; margin-top: 6px;">
            ${feedback}
          </div>

          <p style="font-size: 16px; margin-top: 16px;">
            Please review and continue with the next steps of the recruitment process.
          </p>

          <p style="font-size: 16px; margin-top: 24px;">
            Best regards,<br/>
            <strong>User ${position}</strong><br/>
            <span style="color: #6b7280;">BitHealth</span>
          </p>
        </div>
      </div>
    </div>
    `;


  const mailOptions = {
    from: `"HR Team" <${process.env.SMTP_USER}>`,
    to: hrEmail,
    cc: ccList.join(", "),
    subject,
    html,
    attachments: [
      {
        filename: 'logo_bithealth.png',
        path: './logo_bithealth.png',
        cid: 'bithealthlogo', 
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("📨 Passed candidate email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Failed to send passed candidate email:", err);
    throw err;
  }
};

const sendtechlink = async (
  email: string,
  name: string,
  level: string,
  position: string,
  ccUser: string,
  techLink : string,
) => {
  // Validate SMTP configuration
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP configuration is missing. Please check your .env file.');
  }
  
  console.log("ENV:", process.env.SMTP_HOST, process.env.SMTP_USER);

  const ccManual = ["hrviewer8@gmail.com"];
  const ccList = [
    ccUser,
    ...ccManual
  ].filter(Boolean);
  

  const mailOptions = {
    from: `"HR Team" <${process.env.SMTP_USER}>`,
    to: email,
    cc: ccList.join(", "),
    subject: `Application Status Update – ${level} ${position}`,
    html: `
      <div style="background-color: #f3f4f6; padding: 40px 16px; font-family: 'Segoe UI', Arial, sans-serif;">
        <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <!-- Header / Logo -->
          <div style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb; text-align: center; background-color: #ffffff;">
            <img src="cid:bithealthlogo" alt="BitHealth Logo" width="350" style="display:block; margin:0 auto;"/>
          </div>

           <!-- Content -->
          <div style="padding:32px; color:#2b2b2b; line-height:1.7;">
            <p>Dear <strong>${name}</strong>,</p>

            <p style="font-weight:600; color:#065f46; margin-top:16px;">
              🎉 We are pleased to inform you that you have successfully passed the initial screening stage.
            </p>

            <p>
              As the next step in our recruitment process, we would like to invite you to complete a 
              <strong>Technical Test</strong>.
            </p>

            <!-- Technical Test Box -->
            <div style="
              margin:24px 0;
              padding:20px;
              background-color:#f9fafb;
              border-left:5px solid #16a34a;
              border-radius:6px;
            ">
              <p style="margin:0 0 10px; font-weight:600; color:#1f2937;">
                🔧 Technical Test Details
              </p>

              <p style="margin:0 0 12px;">
                Please access the technical test using the link below:
              </p>

              <a href="${techLink}" 
                target="_blank"
                style="
                  display:inline-block;
                  padding:12px 20px;
                  background-color:#16a34a;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:6px;
                  font-weight:600;
                ">
                Start Technical Test
              </a>

              <p style="margin-top:14px; font-size:14px; color:#6b7280;">
                Please ensure the test is completed within the specified timeframe.
              </p>
            </div>

            <p>
              If you have any questions or encounter any issues accessing the test, 
              please do not hesitate to contact us.
            </p>

            <p>
              We appreciate your interest in joining BitHealth and wish you the very best of luck in this next stage.
            </p>

            <p style="margin-top:32px;">
              Kind regards,<br/>
              <strong>Human Resources Team</strong><br/>
              <span style="color:#6b7280;">BitHealth</span>
            </p>
          </div>

        </div>
      </div>
      `,
    attachments: [
      {
        filename: 'logo_bithealth.png',
        path: './logo_bithealth.png',
        cid: 'bithealthlogo', 
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};



const sendCandidateReopenedEmail = async (
  email: string,
  name: string,
  level: string,
  position: string,
  ccUser: string,
  nameuser :string,
) => {
  // Validate SMTP configuration
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP configuration is missing. Please check your .env file.');
  }
  
  console.log("ENV:", process.env.SMTP_HOST, process.env.SMTP_USER);

  const ccManual = ["hrviewer8@gmail.com"];
  const ccList = [
    ...ccManual
  ].filter(Boolean);
  

  const mailOptions = {
    from: `"HR Team" <${process.env.SMTP_USER}>`,
    to: ccUser,
    cc: ccList.join(", "),
    subject: `Re-Open Candidate Application– ${level} ${position}`,
    html: `
      <div style="background-color: #f3f4f6; padding: 40px 16px; font-family: 'Segoe UI', Arial, sans-serif;">
        <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <!-- Header / Logo -->
          <div style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb; text-align: center; background-color: #ffffff;">
            <img src="cid:bithealthlogo" alt="BitHealth Logo" width="350" style="display:block; margin:0 auto;"/>
          </div>

           <!-- Content -->
          <div style="padding:32px; color:#2b2b2b; line-height:1.7;">
            <p>Dear Mr/Mrs <strong>${nameuser}</strong>,</p>

            <p style="font-weight:600; color:#065f46; margin-top:16px;">
              🔄 We would like to inform you that the candidate <strong>${name}</strong> for the position 
              <strong>${level} ${position}</strong> has been <strong>Re-Opened</strong> in our recruitment system.
            </p>

            <p style="margin-top:14px; font-size:14px; color:#4b5563;">
              This update indicates that the candidate is once again eligible to continue in the recruitment process. 
              The re-opening has been made following an internal review and is intended to allow further evaluation 
              and consideration based on current recruitment needs.
            </p>

            <p style="margin-top:14px; font-size:14px; color:#4b5563;">
              We kindly request you to review the candidate’s profile and previous assessment results in the system. 
              If deemed appropriate, please proceed with the next steps, such as scheduling an assessment, test, 
              or interview session, in accordance with the standard recruitment workflow.
            </p>

            <p style="margin-top:14px; font-size:14px; color:#6b7280;">
              Should you require any additional information or clarification regarding this update, 
              please do not hesitate to reach out to the Human Resources team.
            </p>


            <p style="margin-top:32px;">
              Kind regards,<br/>
              <strong>Human Resources Team</strong><br/>
              <span style="color:#6b7280;">BitHealth</span>
            </p>
          </div>

        </div>
      </div>
      `,
    attachments: [
      {
        filename: 'logo_bithealth.png',
        path: './logo_bithealth.png',
        cid: 'bithealthlogo', 
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};


const sendWithdrawEmail = async (
  email: string,
  name: string,
  level: string,
  position: string,
  ccUser: string,
  nameuser :string,
) => {
  // Validate SMTP configuration
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP configuration is missing. Please check your .env file.');
  }
  
  console.log("ENV:", process.env.SMTP_HOST, process.env.SMTP_USER);

  const ccManual = ["hrviewer8@gmail.com"];
  const ccList = [
    ...ccManual
  ].filter(Boolean);
  

  const mailOptions = {
    from: `"HR Team" <${process.env.SMTP_USER}>`,
    to: ccUser,
    cc: ccList.join(", "),
    subject: `Candidate Withdrawal Status – ${level} ${position}`,
    html: `
      <div style="background-color: #f3f4f6; padding: 40px 16px; font-family: 'Segoe UI', Arial, sans-serif;">
        <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <!-- Header / Logo -->
          <div style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb; text-align: center; background-color: #ffffff;">
            <img src="cid:bithealthlogo" alt="BitHealth Logo" width="350" style="display:block; margin:0 auto;"/>
          </div>

           <!-- Content -->
          <div style="padding:32px; color:#2b2b2b; line-height:1.7;">
            <p>Dear Mr/Mrs <strong>${nameuser}</strong>,</p>

            <p style="font-weight:600; color:#7c2d12; margin-top:16px;">
              ⚠️ We would like to inform you that the candidate <strong>${name}</strong> 
              for the position <strong>${level} ${position}</strong> has decided to 
              <strong>withdraw from the recruitment process</strong>.
            </p>

            <p style="margin-top:14px; font-size:14px; color:#6b7280;">
              As a result, the candidate will no longer proceed to the next stages of the selection process. 
              This decision was made by the candidate due to personal considerations, and we respect their choice.
            </p>

            <p style="margin-top:14px; font-size:14px; color:#6b7280;">
              Kindly update your records accordingly and feel free to proceed with other candidates 
              who are currently under evaluation for this position.
            </p>

            <p style="margin-top:32px;">
              Kind regards,<br/>
              <strong>Human Resources Team</strong><br/>
              <span style="color:#6b7280;">BitHealth</span>
            </p>
          </div>

        </div>
      </div>
      `,
    attachments: [
      {
        filename: 'logo_bithealth.png',
        path: './logo_bithealth.png',
        cid: 'bithealthlogo', 
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};


// -------------------
// UPDATE STATUS //
// -------------------

export const updateCandidateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newStatus,feedback } = req.body; // expected integer 2 | 3
    // const newStatusNum = Number(newStatus);
    const newStatusNumOriginal = Number(newStatus);
    let newStatusNum = newStatusNumOriginal;

    const result = await pool.query(
      `SELECT cp.status, cp.email, cp.name, ps.level, ps.position, u.email as ccUser, u.name as nameuser
       FROM candidate_profile cp
       INNER JOIN positions ps ON cp.position_id = ps.id
       Left join users u ON u.position_name = ps.position AND u.position_id > ps.id
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
    if (newStatusNum === 6) {
      try {
        sendPassedCandidateEmail(
          "hrviewer8@gmail.com",
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

    if ([3, 7].includes(Number(candidate.status)) && Number(newStatus) === 0){
      const historyRes = await pool.query(
        `SELECT 
           CASE 
             WHEN su.schedule IS NULL THEN 1
             WHEN su.schedule IS NOT NULL THEN 6
           END AS previous_status
         FROM candidate_profile cp
         LEFT JOIN schedule_user_interview su 
           ON su.candidate_id = cp.id
           AND su.position_id = cp.position_id
         WHERE cp.id = $1`,
        [id]
      );

      newStatusNum = historyRes.rows[0]?.previous_status ?? 1; // 
   

      // kirim email Re-Open jika perlu
      try {
        sendCandidateReopenedEmail(
          candidate.email,
          candidate.name,
          candidate.level,
          candidate.position,
          candidate.ccuser,
          candidate.nameuser
        );
      } catch (emailError: any) {
        console.error("❌ Failed to send reopened email:", emailError.message);
      }
    }


    if (
      !(
        (candidate.status == 1 && [2, 3, 5,7].includes(newStatusNum)) ||
        (candidate.status == 5 && [3, 6,7].includes(newStatusNum)) ||
        (candidate.status == 6 && [3, 2,7].includes(newStatusNum)) ||
        (candidate.status == 3 && [1,6].includes(newStatusNum)) ||
        (candidate.status == 7 && [1,6].includes(newStatusNum))
      )
    ) {
      return res.status(400).json({
        error: `Invalid status transition from ${candidate.status} to ${newStatusNum}`
      });
    }

    if (![2, 3, 5, 6, 1,7].includes(newStatusNum)) {
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
        sendRejectionEmail(
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
        sendScheduleEmail(
          candidate.email,
          candidate.name,
          candidate.level,
          candidate.position,
          schedule,
          req.user!.email,
          "create"
        );
        console.log(`📨 Schedule email sent to ${candidate.email}`);
      } catch (emailError: any) {
        console.error("❌ Failed to send schedule email:", emailError.message);
      }
    }

    if (newStatusNum === 7) {
      try {
        sendWithdrawEmail(
          candidate.email,
          candidate.name,
          candidate.level,
          candidate.position,
          candidate.ccuser,
          candidate.nameuser
        );
        console.log(`📨  email sent to ${candidate.ccuser}`);
      } catch (emailError: any) {
        console.error("❌ Failed to send withdraw email:", emailError.message);
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
                     sc.curt,
                     sc.nervous,
                     sc.calmness,
                     sc.confident,
                     sc.enthusiast,
                     cp.cv_link,
                     sc.summary_desc AS summary,
                     cp.technical_link AS tech_link,
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
        ih.quest_num,
        ih.question,
        ih.answer,
        ih.audio_content,
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
        `SELECT cp.email, cp.name, ps.level, ps.position, cp.status,u.email as ccUser
        FROM candidate_profile cp
        INNER JOIN positions ps ON cp.position_id = ps.id
        INNER JOIN users u ON ps.position = u.position_name AND ps.id < u.position_id
        WHERE cp.id = $1`,
        [candidate_id]
      );
      const candidate = candidateRes.rows[0];

      try {
        await sendScheduleEmail(
          candidate.email,
          candidate.name,
          candidate.level,
          candidate.position,
          schedule,
          candidate.ccuser,
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


export const updateTechLink = async (req: AuthRequest, res: Response) => {
  const candidateId = Number(req.params.id);
  const { tech_link, position_id } = req.body;

  if (!tech_link || !position_id) {
    return res.status(400).json({
      error: 'tech_link and position_id are required'
    });
  }

  try {
    const result = await pool.query(
      `
      UPDATE candidate_profile
      SET technical_link = $1,
          updated_date = NOW()
      WHERE id = $2
        AND position_id = $3
      RETURNING *
      `,
      [tech_link, candidateId, position_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'Candidate or position not found'
      });
    }

    const candidateRes = await pool.query(
        `SELECT cp.email, cp.name, ps.level, ps.position, cp.status, cp.technical_link
        FROM candidate_profile cp
        INNER JOIN positions ps ON cp.position_id = ps.id
        WHERE cp.id = $1`,
        [candidateId]
      );

    const candidate = candidateRes.rows[0];

     sendtechlink(
      candidate.email,
      candidate.name,
      candidate.level,
      candidate.position,
      req.user!.email,  
      candidate.technical_link
    ).catch(err => {
      console.error('Failed to send technical test email:', err);
    });

    return res.json({
      message: 'Technical link updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update tech link error:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};
