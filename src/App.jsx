import { useCallback, useEffect, useRef, useState } from 'react';
import Waveform, { MIN_SELECTION } from './components/Waveform.jsx';
import { computePeaks } from './lib/peaks.js';
import { encodeWav, wavSizeFor } from './lib/wav.js';
import { formatBytes, formatChannels, formatSampleRate, formatTime } from './lib/format.js';
import { detectLang, messages, rememberLang } from './lib/i18n.js';

const ACCEPT = 'audio/*,.mp3,.wav,.m4a,.ogg,.oga,.flac,.aac,.opus,.webm,.aiff';

function ensureContext(ref) {
  if (!ref.current) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    ref.current = new Ctor();
  }
  return ref.current;
}

function PlayIcon() {
  return (
    <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M4.5 2.8v10.4a.6.6 0 0 0 .92.5l8.2-5.2a.6.6 0 0 0 0-1L5.42 2.3a.6.6 0 0 0-.92.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="3.5" y="2.5" width="3.5" height="11" rx="1.1" fill="currentColor" />
      <rect x="9" y="2.5" width="3.5" height="11" rx="1.1" fill="currentColor" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      className="icon"
      viewBox="0 0 16 16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v8m0 0 3-3m-3 3L5 7M2.5 12.5v.5a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-.5" />
    </svg>
  );
}

export default function App() {
  const [lang, setLang] = useState(detectLang);
  const [track, setTrack] = useState(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [position, setPosition] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const ctxRef = useRef(null);
  const sourceRef = useRef(null);
  const rafRef = useRef(0);
  const playOriginRef = useRef({ at: 0, from: 0 });
  const fileInputRef = useRef(null);
  const downloadTimerRef = useRef(0);

  const t = messages[lang];

  useEffect(() => {
    document.documentElement.lang = t.htmlLang;
    document.title = t.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.description);
  }, [t]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const source = sourceRef.current;
    sourceRef.current = null;
    if (source) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        /* kaynak zaten bitmiş olabilir */
      }
      source.disconnect();
    }
    setPlaying(false);
    setPosition(null);
  }, []);

  const loadFile = useCallback(
    async (file) => {
      if (!file) return;
      stop();
      setError('');
      setBusy(true);
      try {
        const bytes = await file.arrayBuffer();
        const ctx = ensureContext(ctxRef);
        const buffer = await ctx.decodeAudioData(bytes);

        setTrack({
          label: file.name,
          name: file.name.replace(/\.[^.]+$/, '') || 'audio',
          buffer,
          peaks: computePeaks(buffer, 2400),
          duration: buffer.duration,
          sampleRate: buffer.sampleRate,
          channels: buffer.numberOfChannels,
        });
        setSelection({ start: 0, end: buffer.duration });
        setPosition(null);
      } catch {
        setError(t.error);
      } finally {
        setBusy(false);
      }
    },
    [stop, t.error],
  );

  const togglePlay = useCallback(async () => {
    if (!track) return;
    if (playing) {
      stop();
      return;
    }
    if (selection.end - selection.start < MIN_SELECTION) return;

    const ctx = ensureContext(ctxRef);
    if (ctx.state === 'suspended') await ctx.resume();

    const from = selection.start;
    const until = selection.end;
    const source = ctx.createBufferSource();
    source.buffer = track.buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      if (sourceRef.current === source) stop();
    };
    source.start(0, from, until - from);

    sourceRef.current = source;
    playOriginRef.current = { at: ctx.currentTime, from };
    setPlaying(true);
    setPosition(from);

    const tick = () => {
      if (sourceRef.current !== source) return;
      const { at, from: origin } = playOriginRef.current;
      const current = Math.min(until, origin + (ctx.currentTime - at));
      setPosition(current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [track, playing, selection, stop]);

  const handleSelectionChange = useCallback(
    (next) => {
      if (sourceRef.current) stop();
      setSelection(next);
    },
    [stop],
  );

  const handleDownload = () => {
    if (!track) return;
    const blob = encodeWav(track.buffer, selection.start, selection.end);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${track.name}-cutter.wav`;
    link.click();

    window.setTimeout(() => URL.revokeObjectURL(url), 15000);
    setDownloaded(true);
    window.clearTimeout(downloadTimerRef.current);
    downloadTimerRef.current = window.setTimeout(() => setDownloaded(false), 1800);
  };

  const toggleLang = () => {
    const next = lang === 'tr' ? 'en' : 'tr';
    rememberLang(next);
    setLang(next);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code !== 'Space') return;
      const target = event.target;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.getAttribute('role') === 'slider'
      ) {
        return;
      }
      event.preventDefault();
      togglePlay();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [togglePlay]);

  useEffect(() => {
    document.body.classList.toggle('is-drag', dragging);
    return () => document.body.classList.remove('is-drag');
  }, [dragging]);

  useEffect(() => {
    let depth = 0;

    const hasFiles = (event) => Array.from(event.dataTransfer?.types ?? []).includes('Files');

    const onDragOver = (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    };
    const onDragEnter = (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth += 1;
      setDragging(true);
    };
    const onDragLeave = (event) => {
      if (!hasFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const onDrop = (event) => {
      event.preventDefault();
      depth = 0;
      setDragging(false);
      const file = event.dataTransfer?.files?.[0];
      if (file) loadFile(file);
    };
    const onPaste = (event) => {
      const file = Array.from(event.clipboardData?.files ?? [])[0];
      if (file) loadFile(file);
    };

    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('paste', onPaste);
    };
  }, [loadFile]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      sourceRef.current?.disconnect?.();
      ctxRef.current?.close?.();
    },
    [],
  );

  const openPicker = () => fileInputRef.current?.click();
  const selectionLength = Math.max(0, selection.end - selection.start);
  const selectionEmpty = selectionLength < MIN_SELECTION;

  return (
    <main className="shell">
      <header className="top">
        <div className="brand">
          <svg className="brand-mark" viewBox="0 0 16 16" aria-hidden="true">
            <rect x="1" y="6" width="2" height="4" rx="1" />
            <rect x="5" y="2" width="2" height="12" rx="1" />
            <rect x="9" y="4.5" width="2" height="7" rx="1" />
            <rect x="13" y="7" width="2" height="2" rx="1" />
          </svg>
          <span>Audio Cutter</span>
        </div>

        <div className="top-side">
          <span className="privacy">
            <span className="dot" aria-hidden="true" />
            {t.privacy}
          </span>
          <button
            className="lang-btn"
            type="button"
            onClick={toggleLang}
            aria-label={t.switchTo}
            title={t.switchTo}
          >
            {t.toggleLabel}
          </button>
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) loadFile(file);
        }}
      />

      {!track ? (
        <>
          <section className="intro">
            <h1>
              {t.headline1}
              <br />
              {t.headline2}
            </h1>
            <p>{t.intro}</p>
          </section>

          <button className="drop" type="button" onClick={openPicker} disabled={busy}>
            <svg
              className="drop-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M3 12h1.5M8 6v12M12 9v6M16 4v16M20 10v4" />
            </svg>
            <strong>{busy ? t.dropBusy : t.dropTitle}</strong>
            <span>
              {busy ? (
                t.dropBusyHint
              ) : (
                <>
                  {t.dropHint} <u>{t.dropChoose}</u> {t.dropFormats}
                </>
              )}
            </span>
          </button>
        </>
      ) : (
        <section className="editor" aria-label={t.editorLabel}>
          <div className="filebar">
            <div className="file-meta">
              <span className="file-name" title={track.label}>
                {track.label}
              </span>
              <span className="file-sub">
                {formatTime(track.duration, lang)} ·{' '}
                {formatSampleRate(track.sampleRate, lang)} · {formatChannels(track.channels, t)}
              </span>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={openPicker}
              disabled={busy}
            >
              {busy ? t.decoding : t.changeFile}
            </button>
          </div>

          <Waveform
            peaks={track.peaks}
            duration={track.duration}
            start={selection.start}
            end={selection.end}
            position={position}
            onChange={handleSelectionChange}
            lang={lang}
            labels={{ startPoint: t.startPoint, endPoint: t.endPoint }}
          />

          <div className="ruler" aria-hidden="true">
            <span>{formatTime(0, lang)}</span>
            <span>{formatTime(track.duration / 2, lang)}</span>
            <span>{formatTime(track.duration, lang)}</span>
          </div>

          <div className="readouts">
            <div className="readout">
              <span className="label">{t.start}</span>
              <span className="value">{formatTime(selection.start, lang)}</span>
            </div>
            <div className="readout">
              <span className="label">{t.end}</span>
              <span className="value">{formatTime(selection.end, lang)}</span>
            </div>
            <div className="readout">
              <span className="label">{t.length}</span>
              <span className="value value-accent">{formatTime(selectionLength, lang)}</span>
            </div>
          </div>

          <div className="actions">
            <button
              className="btn"
              type="button"
              onClick={togglePlay}
              aria-pressed={playing}
              disabled={selectionEmpty}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
              <span>{playing ? t.stop : t.play}</span>
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => handleSelectionChange({ start: 0, end: track.duration })}
            >
              {t.selectAll}
            </button>

            <span className="size-hint">
              {formatBytes(wavSizeFor(track.buffer, selection.start, selection.end), lang)} · WAV
            </span>

            <button
              className="btn btn-primary"
              type="button"
              onClick={handleDownload}
              disabled={selectionEmpty}
            >
              <DownloadIcon />
              <span>{downloaded ? t.downloaded : t.download}</span>
            </button>
          </div>

          <p className="hints">
            <span>
              <kbd>{t.keyDrag}</kbd> {t.hintSelect}
            </span>
            <span>
              <kbd>{t.keySpace}</kbd> {t.hintPlay}
            </span>
            <span>
              <kbd>←</kbd>
              <kbd>→</kbd> {t.hintNudge}
            </span>
            <span>
              <kbd>shift</kbd> {t.hintFast}
            </span>
          </p>
        </section>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <footer className="foot">
        <span>{t.footerA}</span>
        <span>{t.footerB}</span>
      </footer>
    </main>
  );
}
