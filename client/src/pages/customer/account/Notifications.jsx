import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../lib/api.js';
import { Badge, Skeleton, EmptyState } from '../../../components/common/ui.jsx';
import { Check, Bell } from '../../../components/common/Icons.jsx';
import { NotificationGlyph } from '../../../lib/glyphs.jsx';
import { timeAgo } from '../../../lib/format.js';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const { data } = await api.get('/account/notifications');
      setNotifications(data.notifications);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markAll() {
    await api.patch('/account/notifications/read-all');
    setNotifications((ns) => ns.map((n) => ({ ...n, isRead: true })));
  }

  async function markOne(id) {
    await api.patch(`/account/notifications/${id}/read`);
    setNotifications((ns) => ns.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
  }

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Notifications</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {unread > 0 ? `${unread} unread` : 'You are all caught up.'}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={markAll} className="btn-ghost btn-sm">
            <Check size={14} /> Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl2" />)}
        </div>
      ) : !notifications.length ? (
        <EmptyState icon="bell" title="Nothing here yet" message="Order updates and offers will land here." />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => {
            const Wrapper = n.link ? Link : 'div';
            return (
              <Wrapper
                key={n._id}
                {...(n.link ? { to: n.link } : {})}
                onClick={() => !n.isRead && markOne(n._id)}
                className={`flex items-start gap-4 rounded-xl2 border p-4 transition ${
                  n.isRead ? 'border-line bg-white' : 'border-rose-200 bg-rose-50/50'
                } ${n.link ? 'cursor-pointer hover:border-rose-300 hover:shadow-soft' : ''}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-rose-500 shadow-soft">
                  <NotificationGlyph icon={n.icon} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-semibold text-ink">{n.title}</p>
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-rose-500" />}
                  </div>
                  {n.body && <p className="mt-0.5 text-[13px] text-ink-muted">{n.body}</p>}
                  <p className="mt-1.5 flex items-center gap-2 text-[11px] text-ink-faint">
                    {timeAgo(n.createdAt)}
                    {n.type && n.type !== 'GENERAL' && (
                      <Badge tone="neutral" className="!text-[9px] !py-0">{n.type}</Badge>
                    )}
                  </p>
                </div>
              </Wrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}
