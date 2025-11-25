import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test Email Configuration
 * Run this script to verify your SMTP settings before using the app
 */
async function testEmailConfiguration() {
  console.log('\n🔍 Testing Email Configuration...\n');

  // Check if environment variables are set
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease add these variables to your .env file');
    console.error('See QUICK_FIX_EMAIL.md for setup instructions\n');
    process.exit(1);
  }

  console.log('✅ Environment variables found:');
  console.log(`   SMTP_HOST: ${process.env.SMTP_HOST}`);
  console.log(`   SMTP_PORT: ${process.env.SMTP_PORT}`);
  console.log(`   SMTP_USER: ${process.env.SMTP_USER}`);
  console.log(`   SMTP_PASS: ${'*'.repeat(process.env.SMTP_PASS?.length || 0)}\n`);

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Test 1: Verify connection
  console.log('🔗 Testing SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');
  } catch (error: any) {
    console.error('❌ SMTP connection failed!\n');
    
    if (error.code === 'EAUTH') {
      console.error('Authentication Error:');
      console.error('- If using Gmail, make sure you are using App Password, not regular password');
      console.error('- Generate App Password at: https://myaccount.google.com/apppasswords');
      console.error('- Enable 2-Step Verification first if needed\n');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      console.error('Connection Timeout:');
      console.error('- Check your internet connection');
      console.error('- Check if firewall is blocking port', process.env.SMTP_PORT);
      console.error('- Verify SMTP_HOST is correct\n');
    } else {
      console.error('Error:', error.message, '\n');
    }
    
    console.error('Full error details:', error);
    process.exit(1);
  }

  // Test 2: Send test email
  console.log('📧 Sending test email...');
  const testEmail = process.env.SMTP_USER; // Send to yourself

  try {
    const info = await transporter.sendMail({
      from: `"FitFource Test" <${process.env.SMTP_USER}>`,
      to: testEmail,
      subject: '✅ Email Configuration Test - FitFource',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h2 style="color: #4CAF50;">🎉 Success!</h2>
          <p>Your email configuration is working correctly.</p>
          <p>This is a test email from <strong>FitFource Backend</strong>.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Configuration Details:</h3>
            <ul>
              <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</li>
              <li><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</li>
              <li><strong>SMTP User:</strong> ${process.env.SMTP_USER}</li>
            </ul>
          </div>
          
          <p>You can now use the rejection email feature in your application.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated test email. If you received this, your email configuration is correct.
          </p>
        </div>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Recipient: ${testEmail}\n`);
    
    console.log('🎉 All tests passed!');
    console.log('Your email configuration is ready to use.\n');
    
    if (process.env.SMTP_HOST === 'smtp.mailtrap.io') {
      console.log('📬 Check your Mailtrap inbox to see the test email');
    } else {
      console.log(`📬 Check your inbox at ${testEmail} to see the test email`);
      console.log('   (Don\'t forget to check spam folder)\n');
    }

  } catch (error: any) {
    console.error('❌ Failed to send test email\n');
    console.error('Error:', error.message);
    console.error('\nFull error details:', error);
    process.exit(1);
  }
}

// Run the test
testEmailConfiguration()
  .then(() => {
    console.log('✨ Email configuration test completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Email configuration test failed:', error);
    process.exit(1);
  });
