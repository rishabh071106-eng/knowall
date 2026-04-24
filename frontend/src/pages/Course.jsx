import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api.js';
import VideoPlayer from '../components/VideoPlayer.jsx';
import { useAuth } from '../auth.jsx';
import { useNavigate } from 'react-router-dom';

export default function Course() {
  const { slug } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [buying, setBuying] = useState(false);
  const [err, setErr] = useState('');

  async function load() {
    const d = await api(`/courses/${slug}`, { auth: !!user });
    setData(d);
    const firstPlayable = d.lessons.find(l => l.is_preview) || d.lessons[0];
    if (firstPlayable) setActiveLesson(firstPlayable);
  }

  useEffect(() => { load(); }, [slug, user?.id]);

  async function buy() {
    if (!user) { nav('/login'); return; }
    setErr(''); setBuying(true);
    try {
      const resp = await api('/payments/order', {
        method: 'POST', body: { courseId: data.course.id },
      });

      // DEV MODE — Razorpay not configured. Simulate instant purchase.
      if (resp.devMode) {
        if (!confirm('DEV MODE: Razorpay keys not configured.\n\nComplete this purchase for free? (In production, the user would pay ₹1 via UPI/card.)')) {
          setBuying(false);
          return;
        }
        await api('/payments/dev-complete', {
          method: 'POST', body: { courseId: data.course.id },
        });
        await load();
        return;
      }

      // Real Razorpay checkout.
      const { orderId, amount, currency, keyId, course } = resp;
      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: keyId,
          amount,
          currency,
          name: 'Knowall',
          description: course.title,
          order_id: orderId,
          prefill: { email: user.email, name: user.name || '' },
          theme: { color: '#4f46e5' },
          handler: async (r) => {
            try {
              await api('/payments/verify', { method: 'POST', body: r });
              resolve();
            } catch (e) { reject(e); }
          },
          modal: { ondismiss: () => reject(new Error('cancelled')) },
        });
        rzp.open();
      });
      await load();
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBuying(false);
    }
  }

  function fmtDur(s) {
    if (!s) return '';
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  if (!data) return <div>Loading…</div>;
  const canWatch = (l) => data.purchased || l.is_preview;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        {activeLesson && canWatch(activeLesson) ? (
          <VideoPlayer lessonId={activeLesson.id} />
        ) : (
          <div className="aspect-video bg-slate-900 text-white rounded-lg flex items-center justify-center p-8 text-center">
            <div>
              <div className="text-lg">Unlock this course for ₹{data.course.price_paise / 100}</div>
              <div className="text-sm opacity-70 mt-1">One-time payment. UPI, card, or netbanking.</div>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold mt-6">{data.course.title}</h1>
        <div className="text-sm uppercase tracking-wide text-brand mt-1">{data.course.category}</div>
        <p className="mt-4 whitespace-pre-wrap text-slate-700">{data.course.description}</p>
      </div>

      <aside className="bg-white border rounded-xl p-4 h-fit">
        {!data.purchased && (
          <button
            onClick={buy}
            disabled={buying}
            className="w-full bg-brand text-white rounded-lg py-3 font-semibold hover:bg-brand-dark disabled:opacity-60"
          >
            {buying ? 'Processing…' : `Buy for ₹${data.course.price_paise / 100}`}
          </button>
        )}
        {err && <div className="text-red-600 text-sm mt-2">{err}</div>}
        {data.purchased && (
          <div className="bg-green-50 text-green-700 text-sm rounded p-2 text-center">✓ You own this course</div>
        )}

        <div className="flex items-center justify-between mt-5 mb-2">
          <h3 className="font-semibold">Lessons</h3>
          <span className="text-xs text-slate-500">
            {data.lessons.length} · {fmtDur(data.lessons.reduce((a, l) => a + (l.duration_seconds || 0), 0))}
          </span>
        </div>
        <ol className="space-y-0.5">
          {data.lessons.map((l, i) => {
            const isActive = activeLesson?.id === l.id;
            const watchable = canWatch(l);
            return (
              <li key={l.id}>
                <button
                  onClick={() => setActiveLesson(l)}
                  className={`w-full text-left text-sm px-2 py-2 rounded flex items-start gap-2 ${
                    isActive ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="text-slate-400 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1">
                    <span className={watchable ? '' : 'text-slate-400'}>{l.title}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">
                      {fmtDur(l.duration_seconds)}
                      {l.is_preview && <span className="ml-2 text-green-600">· free preview</span>}
                    </span>
                  </span>
                  {!watchable && <span className="text-slate-400 text-xs mt-0.5">🔒</span>}
                </button>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
