import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t mt-12 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
        <div>
          <div className="font-bold text-brand text-lg mb-2">Knowall</div>
          <p className="text-slate-500">Learn anything for ₹10. One-time payment. No subscriptions.</p>
        </div>
        <div>
          <div className="font-semibold mb-2">Browse</div>
          <ul className="space-y-1 text-slate-600">
            <li><Link className="hover:text-brand" to="/category/maths">Maths</Link></li>
            <li><Link className="hover:text-brand" to="/category/ai">AI</Link></li>
            <li><Link className="hover:text-brand" to="/category/python">Python</Link></li>
            <li><Link className="hover:text-brand" to="/category/web%20development">Web Dev</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Company</div>
          <ul className="space-y-1 text-slate-600">
            <li><Link className="hover:text-brand" to="/contact">Contact us</Link></li>
            <li><Link className="hover:text-brand" to="/signup">Become an instructor</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Legal</div>
          <ul className="space-y-1 text-slate-600">
            <li><Link className="hover:text-brand" to="/terms">Terms of Service</Link></li>
            <li><Link className="hover:text-brand" to="/privacy">Privacy Policy</Link></li>
            <li><Link className="hover:text-brand" to="/refund">Refund Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Knowall. All rights reserved.</span>
          <span>Made in India · Payments by Razorpay</span>
        </div>
      </div>
    </footer>
  );
}
