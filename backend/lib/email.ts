/**
 * Email confirmation for auto-approved business listings.
 * Uses environment variables only — never hardcode credentials.
 * Railway: set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_FROM_NAME, SITE_URL.
 */

import nodemailer from 'nodemailer';
import { logger } from './logger';

type BusinessForEmail = {
  name: string;
  slug: string;
  category?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  websiteUrl?: string;
};

function getTransporter(): ReturnType<typeof nodemailer.createTransport> | null {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE !== 'false';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    const missing = [(!host && 'SMTP_HOST'), (!user && 'SMTP_USER'), (!pass && 'SMTP_PASS')].filter(Boolean);
    logger.error('[Email] SMTP not configured. Set in backend/.env or Railway backend variables:', missing.join(', '));
    return null;
  }
  const is587 = port === 587;
  return nodemailer.createTransport({
    host,
    port,
    secure: is587 ? false : secure,
    auth: { user, pass },
    ...(is587 && { requireTLS: true }),
  });
}

function getSiteUrl(): string {
  return (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'https://bizbranches.pk').replace(/\/$/, '');
}

/**
 * Send confirmation email after auto-approval. Async, non-blocking.
 * Call with .catch() from route — does not throw to caller.
 */
export async function sendConfirmationEmail(business: BusinessForEmail): Promise<void> {
  if (!business.email || !business.email.trim()) {
    logger.error('Confirmation email skipped: no recipient email for business', business.name);
    return;
  }
  const transporter = getTransporter();
  if (!transporter) {
    logger.error('Confirmation email not sent: set SMTP_HOST, SMTP_USER, SMTP_PASS in Railway Variables');
    return;
  }

  const fromName = process.env.EMAIL_FROM_NAME || 'BizBranches Support';
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'support@bizbranches.pk';
  const replyTo = process.env.EMAIL_REPLY_TO || fromEmail;
  const siteUrl = getSiteUrl();
  const listingUrl = `${siteUrl}/${encodeURIComponent(business.slug)}`;
  const supportEmail = process.env.SUPPORT_EMAIL || fromEmail;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your listing is live</title></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #059669;">Your business is now live on BizBranches</h2>
  <p>Thank you for adding your business to Pakistan's free business directory.</p>
  <p><strong>Listing details:</strong></p>
  <ul>
    <li><strong>Business name:</strong> ${escapeHtml(business.name)}</li>
    ${business.category ? `<li><strong>Category:</strong> ${escapeHtml(business.category)}</li>` : ''}
    ${business.city ? `<li><strong>City:</strong> ${escapeHtml(business.city)}</li>` : ''}
    ${business.phone ? `<li><strong>Phone:</strong> ${escapeHtml(business.phone)}</li>` : ''}
    ${business.email ? `<li><strong>Email:</strong> ${escapeHtml(business.email)}</li>` : ''}
  </ul>
  <p><a href="${escapeHtml(listingUrl)}" style="display: inline-block; background: #059669; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View your listing</a></p>
  <p style="margin-top: 24px; font-size: 14px; color: #666;">If you have any questions, contact us at <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a>.</p>
  <p style="margin-top: 16px; font-size: 12px; color: #999;">— BizBranches Support</p>
</body>
</html>`;

  const text = `
Your business is now live on BizBranches.

Thank you for adding your business to Pakistan's free business directory.

Listing details:
- Business name: ${business.name}
${business.category ? `- Category: ${business.category}` : ''}
${business.city ? `- City: ${business.city}` : ''}
${business.phone ? `- Phone: ${business.phone}` : ''}
${business.email ? `- Email: ${business.email}` : ''}

View your listing: ${listingUrl}

If you have any questions, contact us at ${supportEmail}.

— BizBranches Support
`.trim();

  const toEmail = business.email.trim();
  // Log so it appears in Railway (logger.log is dev-only)
  logger.error('[Email] Sending confirmation to', toEmail.replace(/(.{2}).*@(.*)/, '$1***@$2'), 'for:', business.name);

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      replyTo,
      subject: 'Your business is live on BizBranches',
      text,
      html: htmlBody,
    });
    logger.error('[Email] Sent successfully for:', business.name);
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string; response?: string; command?: string };
    const msg = e?.message ?? String(err);
    const code = e?.code ?? '';
    const response = e?.response ? String(e.response).slice(0, 300) : '';
    logger.error('[Email] Failed for:', business.name, '|', msg, code ? `| code: ${code}` : '', response ? `| response: ${response}` : '');
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
