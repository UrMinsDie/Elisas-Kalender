import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Settings {
  site_title: string;
  owner_display_name: string;
  contact_email: string;
  timezone: string;
  minimum_duration_minutes: number;
  maximum_duration_minutes: number;
  slot_interval_minutes: number;
  buffer_minutes: number;
  minimum_notice_hours: number;
  maximum_advance_days: number;
  pending_blocks_time: boolean;
  privacy_policy_url: string;
  primary_color: string;
  free_color: string;
  pending_color: string;
  busy_color: string;
  blocked_color: string;
}

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.from('app_settings').select('*').eq('id', 1).single().then(({ data }) => setSettings(data as Settings));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    const { error } = await supabase.from('app_settings').update(settings).eq('id', 1);
    setMessage(error ? 'Einstellungen konnten nicht gespeichert werden.' : 'Einstellungen gespeichert.');
  }

  if (!settings) return <p>Lade Einstellungen...</p>;

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  }

  const maximumDurationDays = Math.max(1, Math.round(settings.maximum_duration_minutes / 1440));

  return (
    <>
      <div className="page-head settings-head">
        <div>
          <p className="eyebrow">Adminbereich</p>
          <h1>Einstellungen</h1>
          <p>Lege fest, wie Elisas Kalender öffentlich angezeigt wird und welche Regeln für neue Anfragen gelten.</p>
        </div>
      </div>

      <form className="settings-form" onSubmit={save}>
        <section className="settings-section">
          <div>
            <h2>Allgemein</h2>
            <p>Diese Angaben sehen Gäste auf der öffentlichen Seite und im Anfrageformular.</p>
          </div>
          <div className="settings-fields">
            <label>Seitentitel
              <input value={settings.site_title ?? ''} onChange={(e) => update('site_title', e.target.value)} />
              <small className="hint">Zum Beispiel: Elisas Kalender</small>
            </label>
            <label>Anzeigename
              <input value={settings.owner_display_name ?? ''} onChange={(e) => update('owner_display_name', e.target.value)} />
              <small className="hint">Dieser Name wird in Texten wie „Treffen mit Elisa anfragen“ verwendet.</small>
            </label>
            <label>Kontakt-E-Mail
              <input type="email" value={settings.contact_email ?? ''} onChange={(e) => update('contact_email', e.target.value)} placeholder="optional" />
            </label>
            <label>Zeitzone
              <select value={settings.timezone} onChange={(e) => update('timezone', e.target.value)}>
                <option value="Europe/Berlin">Europe/Berlin</option>
                <option value="Europe/Vienna">Europe/Vienna</option>
                <option value="Europe/Zurich">Europe/Zurich</option>
              </select>
            </label>
            <label className="span-two">Link zur Datenschutzerklärung
              <input type="url" value={settings.privacy_policy_url ?? ''} onChange={(e) => update('privacy_policy_url', e.target.value)} placeholder="https://..." />
            </label>
          </div>
        </section>

        <section className="settings-section">
          <div>
            <h2>Buchungsregeln</h2>
            <p>Damit Anfragen sinnvoll lang sind und nicht zu kurzfristig oder zu weit im Voraus gestellt werden.</p>
          </div>
          <div className="settings-fields compact">
            <label>Mindestdauer
              <div className="input-suffix"><input type="number" min="1" value={settings.minimum_duration_minutes} onChange={(e) => update('minimum_duration_minutes', Number(e.target.value))} /><span>Min.</span></div>
            </label>
            <label>Maximaldauer
              <div className="input-suffix"><input type="number" min="1" value={maximumDurationDays} onChange={(e) => update('maximum_duration_minutes', Number(e.target.value) * 1440)} /><span>Tage</span></div>
            </label>
            <label>Zeitschritte
              <div className="input-suffix"><input type="number" min="1" value={settings.slot_interval_minutes} onChange={(e) => update('slot_interval_minutes', Number(e.target.value))} /><span>Min.</span></div>
            </label>
            <label>Puffer zwischen Terminen
              <div className="input-suffix"><input type="number" min="0" value={settings.buffer_minutes} onChange={(e) => update('buffer_minutes', Number(e.target.value))} /><span>Min.</span></div>
            </label>
            <label>Mindestvorlauf
              <div className="input-suffix"><input type="number" min="0" value={settings.minimum_notice_hours} onChange={(e) => update('minimum_notice_hours', Number(e.target.value))} /><span>Std.</span></div>
            </label>
            <label>Maximal im Voraus
              <div className="input-suffix"><input type="number" min="1" value={settings.maximum_advance_days} onChange={(e) => update('maximum_advance_days', Number(e.target.value))} /><span>Tage</span></div>
            </label>
            <label className="toggle span-two">
              <input type="checkbox" checked={settings.pending_blocks_time} onChange={(e) => update('pending_blocks_time', e.target.checked)} />
              <span>
                <strong>Ausstehende Anfragen blockieren vorläufig</strong>
                <small>Solange Elisa noch nicht entschieden hat, sehen andere diesen Zeitraum als vorläufig angefragt.</small>
              </span>
            </label>
          </div>
        </section>

        <section className="settings-section">
          <div>
            <h2>Farben</h2>
            <p>Diese Farben helfen Gästen, freie und belegte Zeiten schnell zu unterscheiden.</p>
          </div>
          <div className="color-grid">
            <ColorField label="Hauptfarbe" value={settings.primary_color} onChange={(value) => update('primary_color', value)} />
            <ColorField label="Frei" value={settings.free_color} onChange={(value) => update('free_color', value)} />
            <ColorField label="Vorläufig angefragt" value={settings.pending_color} onChange={(value) => update('pending_color', value)} />
            <ColorField label="Belegt" value={settings.busy_color} onChange={(value) => update('busy_color', value)} />
            <ColorField label="Nicht verfügbar" value={settings.blocked_color} onChange={(value) => update('blocked_color', value)} />
          </div>
        </section>

        <div className="settings-savebar">
          {message && <p className={message.includes('nicht') ? 'alert' : 'success'}>{message}</p>}
          <button className="button">Einstellungen speichern</button>
        </div>
      </form>
    </>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="color-field">
      <span>{label}</span>
      <div>
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </label>
  );
}
