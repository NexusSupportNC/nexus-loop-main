const nodemailer = require('nodemailer');
const userModel = require('../models/userModel');

class EmailNotificationService {
  constructor() {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      // For development, use ethereal email or configure with your SMTP settings
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'ethereal.user@example.com',
        pass: process.env.SMTP_PASS || 'ethereal.pass'
      },
      // For development, log emails instead of sending
      logger: true,
      debug: true
    });
  }

  async sendNewLoopNotification(loop, creator) {
    try {
      const admins = userModel.getAdminsWithNotifications('new');
      
      if (admins.length === 0) {
        console.log('No admins configured for new loop notifications');
        return;
      }

      const subject = `New Loop Created: ${loop.type} - ${loop.property_address}`;
      const htmlContent = this.generateNewLoopEmailHTML(loop, creator);
      const textContent = this.generateNewLoopEmailText(loop, creator);

      for (const admin of admins) {
        await this.sendEmail(admin.email, subject, textContent, htmlContent);
      }

      console.log(`New loop notification sent to ${admins.length} admin(s)`);
    } catch (error) {
      console.error('Error sending new loop notification:', error);
    }
  }

  async sendUpdatedLoopNotification(loop, updater, changes) {
    try {
      const admins = userModel.getAdminsWithNotifications('updated');
      
      if (admins.length === 0) {
        console.log('No admins configured for updated loop notifications');
        return;
      }

      const subject = `Loop Updated: ${loop.type} - ${loop.property_address}`;
      const htmlContent = this.generateUpdatedLoopEmailHTML(loop, updater, changes);
      const textContent = this.generateUpdatedLoopEmailText(loop, updater, changes);

      for (const admin of admins) {
        await this.sendEmail(admin.email, subject, textContent, htmlContent);
      }

      console.log(`Updated loop notification sent to ${admins.length} admin(s)`);
    } catch (error) {
      console.error('Error sending updated loop notification:', error);
    }
  }

  async sendEmail(to, subject, text, html) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || '"Real Estate System" <noreply@nexusrealtync.co>',
        to,
        subject,
        text,
        html
      });

      console.log(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  generateNewLoopEmailHTML(loop, creator) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Loop Created</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; }
          .detail-row { margin-bottom: 10px; }
          .label { font-weight: bold; color: #374151; }
          .value { color: #6b7280; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Transaction Loop Created</h1>
          </div>
          <div class="content">
            <p>A new transaction loop has been created in the system.</p>
            
            <div class="detail-row">
              <span class="label">Loop ID:</span> 
              <span class="value">#${loop.id}</span>
            </div>
            <div class="detail-row">
              <span class="label">Type:</span> 
              <span class="value">${loop.type}</span>
            </div>
            <div class="detail-row">
              <span class="label">Property Address:</span> 
              <span class="value">${loop.property_address}</span>
            </div>
            <div class="detail-row">
              <span class="label">Client:</span> 
              <span class="value">${loop.client_name}</span>
            </div>
            <div class="detail-row">
              <span class="label">Sale Amount:</span> 
              <span class="value">${loop.sale ? `$${parseFloat(loop.sale).toLocaleString()}` : 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="label">Status:</span> 
              <span class="value">${loop.status}</span>
            </div>
            <div class="detail-row">
              <span class="label">Created By:</span> 
              <span class="value">${creator.name}</span>
            </div>
            <div class="detail-row">
              <span class="label">Target Close Date:</span> 
              <span class="value">${loop.end_date || 'Not set'}</span>
            </div>
            
            ${loop.notes ? `
            <div class="detail-row">
              <span class="label">Notes:</span> 
              <span class="value">${loop.notes}</span>
            </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>Real Estate Transaction Management System</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateNewLoopEmailText(loop, creator) {
    return `
NEW TRANSACTION LOOP CREATED

A new transaction loop has been created in the system.

Loop Details:
- Loop ID: #${loop.id}
- Type: ${loop.type}
- Property Address: ${loop.property_address}
- Client: ${loop.client_name}
- Sale Amount: ${loop.sale ? `$${parseFloat(loop.sale).toLocaleString()}` : 'N/A'}
- Status: ${loop.status}
- Created By: ${creator.name}
- Target Close Date: ${loop.end_date || 'Not set'}
${loop.notes ? `- Notes: ${loop.notes}` : ''}

---
Real Estate Transaction Management System
This is an automated notification.
    `.trim();
  }

  generateUpdatedLoopEmailHTML(loop, updater, changes) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Loop Updated</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; }
          .detail-row { margin-bottom: 10px; }
          .label { font-weight: bold; color: #374151; }
          .value { color: #6b7280; }
          .changes { background-color: #fef3c7; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Transaction Loop Updated</h1>
          </div>
          <div class="content">
            <p>A transaction loop has been updated in the system.</p>
            
            <div class="detail-row">
              <span class="label">Loop ID:</span> 
              <span class="value">#${loop.id}</span>
            </div>
            <div class="detail-row">
              <span class="label">Type:</span> 
              <span class="value">${loop.type}</span>
            </div>
            <div class="detail-row">
              <span class="label">Property Address:</span> 
              <span class="value">${loop.property_address}</span>
            </div>
            <div class="detail-row">
              <span class="label">Updated By:</span> 
              <span class="value">${updater.name}</span>
            </div>
            
            <div class="changes">
              <h3>Changes Made:</h3>
              <p>The loop was updated with new information. Please check the system for the latest details.</p>
            </div>
          </div>
          <div class="footer">
            <p>Real Estate Transaction Management System</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateUpdatedLoopEmailText(loop, updater, changes) {
    return `
TRANSACTION LOOP UPDATED

A transaction loop has been updated in the system.

Loop Details:
- Loop ID: #${loop.id}
- Type: ${loop.type}
- Property Address: ${loop.property_address}
- Updated By: ${updater.name}

Changes Made:
The loop was updated with new information. Please check the system for the latest details.

---
Real Estate Transaction Management System
This is an automated notification.
    `.trim();
  }
}

module.exports = new EmailNotificationService();
