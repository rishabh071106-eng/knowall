import LegalLayout from './LegalLayout.jsx';

// PLACEHOLDER — adjust the policy to match what you actually want to offer.
// Razorpay requires a clear, public refund policy for live-mode activation.

export default function Refund() {
  return (
    <LegalLayout title="Refund & Cancellation Policy" lastUpdated="April 2026">
      <p>
        At <strong>[YOUR LEGAL NAME / BUSINESS NAME]</strong>, we want you to be
        confident in your purchase. Because Knowall sells digital, instantly-deliverable
        course content, our refund policy is structured to protect both students and
        instructors.
      </p>

      <h2>1. 7-day no-questions-asked refund</h2>
      <p>
        You may request a full refund within <strong>7 days</strong> of purchase, provided
        you have <strong>watched less than 25%</strong> of the total lessons in the course.
      </p>

      <h2>2. When refunds aren't issued</h2>
      <ul>
        <li>If you've watched 25% or more of the course's lessons.</li>
        <li>If more than 7 days have passed since purchase.</li>
        <li>For any refund request you've already made on a separate purchase that we approved (one refund per user, lifetime).</li>
      </ul>

      <h2>3. How to request a refund</h2>
      <p>
        Email <a href="mailto:[YOUR EMAIL]">[YOUR EMAIL]</a> from the email address on
        your Knowall account, with subject line "Refund request — [course name]".
        Include the course you'd like refunded and the reason.
      </p>
      <p>
        We respond within 2 business days. Approved refunds are credited back to your
        original payment method (UPI, card, netbanking) within 5–7 business days.
      </p>

      <h2>4. Cancellation</h2>
      <p>
        You may delete your Knowall account at any time from your account settings.
        Account deletion does not entitle you to a refund of past purchases.
      </p>

      <h2>5. Disputes and chargebacks</h2>
      <p>
        Please email us first before initiating a chargeback with your bank or payment
        provider. Most issues can be resolved directly within a day.
      </p>

      <h2>6. Service interruptions</h2>
      <p>
        If the Service is unavailable for an extended period (more than 72 consecutive
        hours), and you've recently purchased a course you couldn't access during that
        outage, contact us — we'll either restore access or issue a full refund.
      </p>

      <h2>7. Contact</h2>
      <p>
        For all refund and cancellation matters: <a href="mailto:[YOUR EMAIL]">[YOUR EMAIL]</a>.
      </p>
    </LegalLayout>
  );
}
