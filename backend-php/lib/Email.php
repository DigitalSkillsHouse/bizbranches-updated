<?php

use PHPMailer\PHPMailer\PHPMailer;

class Email {
    public static function sendConfirmation(array $business): void {
        $email = trim($business['email'] ?? '');
        if (empty($email)) return;

        $host = env('SMTP_HOST');
        $user = env('SMTP_USER');
        $pass = env('SMTP_PASS');
        if (!$host || !$user || !$pass) {
            Logger::error('Email not sent: SMTP not configured');
            return;
        }

        $port = (int)env('SMTP_PORT', 465);
        $fromName = env('EMAIL_FROM_NAME', 'BizBranches Support');
        $fromEmail = env('EMAIL_FROM', $user);
        $replyTo = env('EMAIL_REPLY_TO', $fromEmail);
        $siteUrl = rtrim(env('SITE_URL', env('NEXT_PUBLIC_SITE_URL', 'https://bizbranches.pk')), '/');
        $listingUrl = $siteUrl . '/' . urlencode($business['slug']);
        $supportEmail = env('SUPPORT_EMAIL', $fromEmail);

        $name = Sanitize::escapeHtml($business['name']);
        $category = Sanitize::escapeHtml($business['category'] ?? '');
        $city = Sanitize::escapeHtml($business['city'] ?? '');
        $phone = Sanitize::escapeHtml($business['phone'] ?? '');
        $bizEmail = Sanitize::escapeHtml($business['email'] ?? '');

        $html = <<<HTML
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your listing is live</title></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #059669;">Your business is now live on BizBranches</h2>
  <p>Thank you for adding your business to Pakistan's free business directory.</p>
  <p><strong>Listing details:</strong></p>
  <ul>
    <li><strong>Business name:</strong> {$name}</li>
    <li><strong>Category:</strong> {$category}</li>
    <li><strong>City:</strong> {$city}</li>
    <li><strong>Phone:</strong> {$phone}</li>
    <li><strong>Email:</strong> {$bizEmail}</li>
  </ul>
  <p><a href="{$listingUrl}" style="display: inline-block; background: #059669; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View your listing</a></p>
  <p style="margin-top: 24px; font-size: 14px; color: #666;">If you have any questions, contact us at {$supportEmail}.</p>
</body>
</html>
HTML;

        $text = "Your business '{$business['name']}' is now live on BizBranches.\n\nView: $listingUrl";

        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $host;
            $mail->SMTPAuth = true;
            $mail->Username = $user;
            $mail->Password = $pass;
            $mail->SMTPSecure = $port === 587 ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
            $mail->Port = $port;
            $mail->setFrom($fromEmail, $fromName);
            $mail->addAddress($email);
            $mail->addReplyTo($replyTo);
            $mail->isHTML(true);
            $mail->Subject = 'Your business is live on BizBranches';
            $mail->Body = $html;
            $mail->AltBody = $text;
            $mail->CharSet = 'UTF-8';
            $mail->send();
            Logger::error('[Email] Sent successfully for: ' . $business['name']);
        } catch (Exception $e) {
            Logger::error('[Email] Failed for: ' . $business['name'] . ' | ' . $e->getMessage());
        }
    }
}
