// import pool from './connection';
// import bcrypt from 'bcrypt';

// async function seedDatabase() {
//   try {
//     console.log('🌱 Seeding database...');

//     // Create admin user
//     const hashedPassword = await bcrypt.hash('admin123', 10);
//     await pool.query(
//       `INSERT INTO users (email, password, full_name, role) 
//        VALUES ($1, $2, $3, $4) 
//        ON CONFLICT (email) DO NOTHING`,
//       ['admin@hrrecruitment.com', hashedPassword, 'Admin User', 'admin']
//     );

//     // Create sample candidates
//     const candidates = [
//       {
//         full_name: 'John Doe',
//         email: 'john.doe@example.com',
//         phone: '+1234567890',
//         job_role: 'Software Engineer',
//         status: 'in_progress',
//         score: 85,
//         years_of_experience: 5,
//         skills: ['JavaScript', 'React', 'Node.js'],
//         education: 'Bachelor in Computer Science',
//         location: 'New York',
//       },
//       {
//         full_name: 'Jane Smith',
//         email: 'jane.smith@example.com',
//         phone: '+1234567891',
//         job_role: 'Product Manager',
//         status: 'accepted',
//         score: 92,
//         years_of_experience: 7,
//         skills: ['Product Strategy', 'Agile', 'User Research'],
//         education: 'MBA',
//         location: 'San Francisco',
//       },
//       {
//         full_name: 'Mike Johnson',
//         email: 'mike.j@example.com',
//         phone: '+1234567892',
//         job_role: 'UX Designer',
//         status: 'rejected',
//         score: 65,
//         years_of_experience: 3,
//         skills: ['Figma', 'UI Design', 'Prototyping'],
//         education: 'Bachelor in Design',
//         location: 'Los Angeles',
//       },
//       {
//         full_name: 'Sarah Williams',
//         email: 'sarah.w@example.com',
//         phone: '+1234567893',
//         job_role: 'Data Scientist',
//         status: 'in_progress',
//         score: 88,
//         years_of_experience: 4,
//         skills: ['Python', 'Machine Learning', 'SQL'],
//         education: 'Master in Data Science',
//         location: 'Boston',
//       },
//       {
//         full_name: 'David Brown',
//         email: 'david.b@example.com',
//         phone: '+1234567894',
//         job_role: 'Software Engineer',
//         status: 'accepted',
//         score: 90,
//         years_of_experience: 6,
//         skills: ['Java', 'Spring Boot', 'Microservices'],
//         education: 'Bachelor in Computer Engineering',
//         location: 'Seattle',
//       },
//     ];

//     for (const candidate of candidates) {
//       const result = await pool.query(
//         `INSERT INTO candidates (
//           full_name, email, phone, job_role, status, score,
//           years_of_experience, skills, education, location
//         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
//         ON CONFLICT (email) DO NOTHING
//         RETURNING id`,
//         [
//           candidate.full_name,
//           candidate.email,
//           candidate.phone,
//           candidate.job_role,
//           candidate.status,
//           candidate.score,
//           candidate.years_of_experience,
//           candidate.skills,
//           candidate.education,
//           candidate.location,
//         ]
//       );

//       if (result.rows.length > 0) {
//         const candidateId = result.rows[0].id;
        
//         // Add history entry
//         await pool.query(
//           `INSERT INTO candidate_history (candidate_id, action, description, new_status)
//            VALUES ($1, $2, $3, $4)`,
//           [candidateId, 'Created', 'Candidate profile created', candidate.status]
//         );
//       }
//     }

//     // Sample interview questions
//     const questions = [
//       {
//         job_role: 'Software Engineer',
//         question: 'Explain the difference between var, let, and const in JavaScript',
//         category: 'Technical',
//         difficulty: 'medium',
//       },
//       {
//         job_role: 'Software Engineer',
//         question: 'What is the event loop in Node.js?',
//         category: 'Technical',
//         difficulty: 'hard',
//       },
//       {
//         job_role: 'Product Manager',
//         question: 'How do you prioritize features in a product roadmap?',
//         category: 'Strategy',
//         difficulty: 'medium',
//       },
//       {
//         job_role: 'UX Designer',
//         question: 'Explain your design process from research to final mockup',
//         category: 'Process',
//         difficulty: 'easy',
//       },
//     ];

//     for (const question of questions) {
//       await pool.query(
//         `INSERT INTO interview_questions (job_role, question, category, difficulty)
//          VALUES ($1, $2, $3, $4)`,
//         [question.job_role, question.question, question.category, question.difficulty]
//       );
//     }

//     // Sample job requirements
//     const requirements = [
//       {
//         job_role: 'Software Engineer',
//         requirement_type: 'Technical Skills',
//         description: 'Proficient in JavaScript, TypeScript, and React',
//         is_mandatory: true,
//         minimum_years_experience: 3,
//         required_skills: ['JavaScript', 'TypeScript', 'React'],
//       },
//       {
//         job_role: 'Product Manager',
//         requirement_type: 'Experience',
//         description: 'Minimum 5 years of product management experience',
//         is_mandatory: true,
//         minimum_years_experience: 5,
//       },
//       {
//         job_role: 'UX Designer',
//         requirement_type: 'Portfolio',
//         description: 'Strong portfolio demonstrating user-centered design',
//         is_mandatory: true,
//       },
//     ];

//     for (const requirement of requirements) {
//       await pool.query(
//         `INSERT INTO job_requirements (
//           job_role, requirement_type, description, is_mandatory,
//           minimum_years_experience, required_skills
//         ) VALUES ($1, $2, $3, $4, $5, $6)`,
//         [
//           requirement.job_role,
//           requirement.requirement_type,
//           requirement.description,
//           requirement.is_mandatory,
//           requirement.minimum_years_experience || null,
//           requirement.required_skills || null,
//         ]
//       );
//     }

//     console.log('✅ Database seeded successfully!');
//     console.log('');
//     console.log('Default admin credentials:');
//     console.log('Email: admin@hrrecruitment.com');
//     console.log('Password: admin123');
//     console.log('');

//     process.exit(0);
//   } catch (error) {
//     console.error('❌ Error seeding database:', error);
//     process.exit(1);
//   }
// }

// seedDatabase();


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
