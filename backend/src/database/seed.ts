
import pool from './connection';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');

    // ==========================
    // 1. SEED ADMIN USER
    // ==========================
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await pool.query(
      `
      INSERT INTO users (email, password, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
      `,
      ['admin@hrrecruitment.com', hashedPassword, 'Admin User', 'admin']
    );

    console.log("✔ Admin user created");

    // ==========================
    // 2. SEED Candidate_Profile
    // ==========================
    const candidates = [
      {
        Name: 'John Doe',
        Position: 'Software Engineer',
        Email: 'john.doe@example.com',
        Phone: 1234567890,
        BirthDate: '1990-05-10',
        Residence: 'New York',
        Gender: 'Male',
        Summary_Profile: 'Experienced full-stack engineer.',
        Education: 'Bachelor in Computer Science',
        Working_exp: '5 years at TechCorp',
        Organization_exp: 'Lead Developer',
        Portfolio: 'https://portfolio.example.com/john',
        Hard_skill: 'JavaScript, React, Node.js',
        Soft_skill: 'Communication, Teamwork',
        AI_reason: 'High skill match',
        CV_link: 'https://cv-storage.com/john',
        Status: 'In Progress',
        Source: 'LinkedIn'
      },
      {
        Name: 'Jane Smith',
        Position: 'Product Manager',
        Email: 'jane.smith@example.com',
        Phone: 9876543210,
        BirthDate: '1988-09-15',
        Residence: 'San Francisco',
        Gender: 'Female',
        Summary_Profile: 'Senior PM with strong background in SaaS.',
        Education: 'MBA',
        Working_exp: '7 years at SaaSify',
        Organization_exp: 'Product Lead',
        Portfolio: 'https://portfolio.example.com/jane',
        Hard_skill: 'Agile, Strategy, Analytics',
        Soft_skill: 'Leadership, Problem Solving',
        AI_reason: 'Strong leadership and experience',
        CV_link: 'https://cv-storage.com/jane',
        Status: 'Accepted',
        Source: 'Website'
      }
    ];

    for (const c of candidates) {
      await pool.query(
        `
        INSERT INTO Candidate_Profile 
        (Name, Position, Email, Phone, BirthDate, Residence, Gender, Summary_Profile,
         Education, Working_exp, Organization_exp, Portfolio, Hard_skill, Soft_skill,
         AI_reason, CV_link, Status, Source)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        ON CONFLICT (Email) DO NOTHING
        `,
        [
          c.Name, c.Position, c.Email, c.Phone, c.BirthDate, c.Residence, c.Gender,
          c.Summary_Profile, c.Education, c.Working_exp, c.Organization_exp,
          c.Portfolio, c.Hard_skill, c.Soft_skill, c.AI_reason, c.CV_link,
          c.Status, c.Source
        ]
      );
    }

    console.log("✔ Sample candidates inserted");

    // ==========================
    // 3. SEED interview_questions
    // ==========================
    const questions = [
      { question: "Explain what UI/UX means.", category: "Design" },
      { question: "Describe Agile methodology.", category: "Management" },
      { question: "What is an API?", category: "Technical" }
    ];

    for (const q of questions) {
      await pool.query(
        `
        INSERT INTO interview_questions (question, category)
        VALUES ($1, $2)
        `,
        [q.question, q.category]
      );
    }

    console.log("✔ Interview questions inserted");

    // ==========================
    // 4. SEED requirements_Candidate
    // ==========================
    const requirements = [
      {
        Role: 'Software Engineer',
        RequirementList: 'JavaScript, React, Node.js, Problem Solving'
      },
      {
        Role: 'Product Manager',
        RequirementList: 'Roadmap, Leadership, Agile, Strategy'
      }
    ];

    for (const r of requirements) {
      await pool.query(
        `
        INSERT INTO job_requirements (Role, RequirementList)
        VALUES ($1, $2)
        `,
        [r.Role, r.RequirementList]
      );
    }

    console.log("✔ Requirements inserted");

    console.log("\n🎉 Database seeded successfully!");
    console.log("Default admin login:");
    console.log("Email: admin@hrrecruitment.com");
    console.log("Password: admin123\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
