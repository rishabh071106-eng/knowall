import LegalLayout from './LegalLayout.jsx';

// PLACEHOLDER LEGAL TEXT — REPLACE THE BUSINESS DETAILS BEFORE GOING LIVE.
// Razorpay live-mode activation requires a real, accurate Terms page.
// Before you submit for KYC, edit the marked [PLACEHOLDER] sections below.
// For anything bespoke (B2B contracts, enterprise sales), get a lawyer to review.

export default function Terms() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="April 2026">
      <p>
        These Terms of Service ("Terms") govern your access to and use of Knowall
        (the "Service"), operated by <strong>[YOUR LEGAL NAME / BUSINESS NAME]</strong>
        ("we", "us"). By creating an account or purchasing a course, you agree to these Terms.
      </p>

      <h2>1. The service</h2>
      <p>
        Knowall is an online learning platform offering pre-recorded video courses.
        Each course is sold for a one-time fee (currently ₹10 per course) and grants
        you indefinite streaming access — no time limits, no subscriptions.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 13 years old to create an account. If you are between 13
        and 18, you confirm that a parent or legal guardian has reviewed and accepted
        these Terms on your behalf.
      </p>

      <h2>3. Accounts</h2>
      <ul>
        <li>You are responsible for maintaining the confidentiality of your password.</li>
        <li>You must provide accurate, current information when signing up.</li>
        <li>One person may not maintain multiple accounts to evade purchase fees.</li>
      </ul>

      <h2>4. Purchases and payments</h2>
      <p>
        Payments are processed by Razorpay. We do not store your card or UPI details.
        All prices are in Indian Rupees (INR) and inclusive of applicable taxes
        unless stated otherwise.
      </p>

      <h2>5. Intellectual property</h2>
      <p>
        All course videos, written materials, and the Service itself are protected by
        copyright and other intellectual property rights, owned by us, our instructors,
        or licensed third parties (e.g., public-domain content from the Internet Archive).
      </p>
      <p>
        You may stream purchased courses for your personal, non-commercial use.
        You may NOT: download videos by circumventing technical measures, share your
        account, redistribute the content, or use it for paid teaching elsewhere.
      </p>

      <h2>6. Instructor terms</h2>
      <p>
        If you sign up as an instructor and publish courses on Knowall:
      </p>
      <ul>
        <li>You retain copyright in your original content.</li>
        <li>You grant us a non-exclusive, worldwide license to host and stream it to paying users.</li>
        <li>You receive 50% of net revenue from your courses (after payment-processor fees).</li>
        <li>Payouts happen monthly to your registered bank account, subject to a minimum threshold of ₹500.</li>
        <li>You are responsible for ensuring you have the rights to all content you upload, and for any taxes on your earnings.</li>
      </ul>

      <h2>7. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for unlawful purposes or to infringe others' rights.</li>
        <li>Upload content that is defamatory, obscene, or violates any law.</li>
        <li>Attempt to disrupt, reverse-engineer, or gain unauthorized access to the Service.</li>
      </ul>

      <h2>8. Termination</h2>
      <p>
        We may suspend or terminate your account if you violate these Terms. Upon termination,
        your right to access purchased courses ends, but no refund will be issued except as
        required by our Refund Policy.
      </p>

      <h2>9. Disclaimer</h2>
      <p>
        The Service is provided "as is". We do not guarantee uninterrupted availability or
        that the content is free of errors. Educational content is for general informational
        purposes and is not professional advice.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, our total liability to you for any claim
        arising from your use of the Service is limited to the amount you have paid us in
        the 12 months prior to the claim.
      </p>

      <h2>11. Changes to these Terms</h2>
      <p>
        We may update these Terms occasionally. Material changes will be notified by email
        and announced on the site. Continued use after changes means you accept them.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by the laws of India. Any dispute will be subject to the
        exclusive jurisdiction of the courts at <strong>[YOUR CITY / DISTRICT]</strong>, India.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions? Email us at <a href="mailto:[YOUR EMAIL]">[YOUR EMAIL]</a> or visit
        the <a href="/contact">contact page</a>.
      </p>
    </LegalLayout>
  );
}
