import { Link } from 'react-router-dom';
import { ChevronRight, Balloon } from '../../components/common/Icons.jsx';

export default function NotFound() {
  return (
    <div className="container-app flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blush text-rose-400">
        <Balloon size={30} />
      </span>
      <h1 className="font-display text-4xl font-semibold text-ink">This gift got away</h1>
      <p className="mt-3 max-w-md text-[15px] text-ink-muted">
        The page you're looking for doesn't exist — but there are plenty of lovely things a click away.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">Back home <ChevronRight size={15} /></Link>
        <Link to="/gifts" className="btn-ghost">Browse gifts</Link>
      </div>
    </div>
  );
}
