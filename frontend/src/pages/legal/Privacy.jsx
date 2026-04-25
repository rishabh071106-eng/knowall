import LegalLayout from './LegalLayout.jsx';

// PLACEHOLDER — replace [bracketed] sections before going live.

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="April 2026">
      <p>
        This Privacy Policy explains how <strong>[YOUR LEGAL NAME / BUSINESS NAME]</strong>
        ("we", "us") collects, uses, and protects information when you use Knowall
        (the "Service").
      </p>

      <h2>1. What we collect</h2>
      <ul>
        <li><strong>Account info:</strong> name, email address, hashed password.</li>
        <li><strong>Payment info:</strong> Razorpay handles your card / UPI details directly. We only store the transaction ID, amount, and status — never your card or bank details.</li>
        <li><strong>Usage data:</strong> which courses you've bought, which lessons you've watched, and basic technical info (IP address, browser, OS) for security and analytics.</li>
        <li><strong>Cookies:</strong> a single authentication token cookie / localStorage entry that keeps you logged in. No third-party tracking pixels.</li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To provide the Service — show your purchased courses, stream videos, etc.</li>
        <li>To process payments via Razorpay.</li>
        <li>To send transactional emails (purchase confirmations, password resets).</li>
        <li>To improve the platform and detect abuse.</li>
        <li>To comply with legal obligations (e.g., tax records).</li>
      </ul>

      <h2>3. What we don't do</h2>
      <ul>
        <li>We do not sell your personal data.</li>
        <li>We do not share it with advertisers.</li>
        <li>We do not run third-party tracking on the site.</li>
      </ul>

      <h2>4. Third parties we work with</h2>
      <ul>
        <li><strong>Razorpay</strong> — payment processing. <a href="https://razorpay.com/privacy" target="_blank" rel="noopener noreferrer">privacy policy</a></li>
        <li><strong>YouTube</strong> (when courses use YouTube embeds) — subject to YouTube's own privacy terms when you watch a video.</li>
        <li><strong>Internet Archive</strong> — when courses use archive.org videos.</li>
        <li><strong>[Your hosting provider, e.g. Render]</strong> — runs the servers, sees traffic logs.</li>
        <li><strong>[Your email provider, if you add one — e.g. SendGrid]</strong> — sends transactional emails.</li>
      </ul>

      <h2>5. Your rights</h2>
      <p>You can:</p>
      <ul>
        <li>Access the personal data we hold about you (email <a href="mailto:[YOUR EMAIL]">[YOUR EMAIL]</a>).</li>
        <li>Correct any inaccurate data via your account settings.</li>
        <li>Delete your account, which removes your personal data within 30 days (purchase records may be retained for tax/audit purposes).</li>
        <li>Object to processing or withdraw consent at any time.</li>
      </ul>

      <h2>6. Data retention</h2>
      <p>
        We keep account data while your account is active. After deletion, personal data
        is erased within 30 days, except for transaction records required by Indian
        tax law (typically 8 years).
      </p>

      <h2>7. Security</h2>
      <p>
        Passwords are hashed with bcrypt. The site uses HTTPS in production. Payments
        are tokenized by Razorpay and never touch our servers.
      </p>

      <h2>8. Children</h2>
      <p>
        The Service is not directed at children under 13. We do not knowingly collect data
        from children under 13. If you believe we have, contact us and we'll delete it.
      </p>

      <h2>9. Changes</h2>
      <p>
        We'll notify users of material changes by email. The "Last updated" date at the
        top reflects the latest revision.
      </p>

      <h2>10. Contact</h2>
      <p>
        Email <a href="mailto:[YOUR EMAIL]">[YOUR EMAIL]</a> for any privacy questions
        or data requests.
      </p>
    </LegalLayout>
  );
}
