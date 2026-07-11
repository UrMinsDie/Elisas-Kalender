import { getMissingBrowserEnv } from '../lib/env';

export function EnvNotice() {
  const missing = getMissingBrowserEnv();
  if (missing.length === 0) return null;

  return (
    <div className="env-notice" role="status">
      <strong>Supabase ist noch nicht verbunden.</strong>
      <span> Trage in `.env` noch {missing.join(', ')} ein. Die Oberfläche kannst du schon ansehen.</span>
    </div>
  );
}
