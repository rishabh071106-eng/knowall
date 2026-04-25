import LegalLayout from './LegalLayout.jsx';

// PLACEHOLDER — fill in real contact info before going live.

export default function Contact() {
  return (
    <LegalLayout title="Contact us" lastUpdated="April 2026">
      <p>
        We read every email. For the fastest answer, please write from the email
        address on your Knowall account and include your course name where relevant.
      </p>

      <h2>General questions, support, refunds</h2>
      <p>
        <a href="mailto:rishabh071106@gmail.com">rishabh071106@gmail.com</a><br />
        Typical reply time: 1 business day.
      </p>

      <h2>Instructor partnerships</h2>
      <p>
        Want to teach on Knowall? Sign up as an instructor at{' '}
        <a href="/signup">the signup page</a> and pick "Teach" — you can publish your
        first course from your dashboard the same day.
      </p>
      <p>
        Bulk / institutional collaborations: <a href="mailto:rishabh071106@gmail.com">rishabh071106@gmail.com</a>
      </p>

      <h2>Privacy / data requests</h2>
      <p>
        See our <a href="/privacy">Privacy Policy</a>, or email{' '}
        <a href="mailto:rishabh071106@gmail.com">rishabh071106@gmail.com</a>.
      </p>

      <h2>Address</h2>
      <p>
        <strong>Rishabh Sharma</strong><br />
        House No. 2, Nandi Sunshine Apartment, Yemalur<br />
        Bengaluru, Karnataka 560037<br />
        India
      </p>

      <p className="text-xs text-slate-400 mt-8">
        We do not currently offer phone support. All requests are handled via email so
        we have a written record for both sides.
      </p>
    </LegalLayout>
  );
}
