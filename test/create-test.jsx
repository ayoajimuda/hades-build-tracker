'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { getSnapshot, saveBuilds } from '@/lib/buildsStore';
import '@/styles/create.css';

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueSlug(base, builds, ignoreSlug) {
  let slug = base || 'untitled';
  let n = 2;
  while (builds.some((b) => b.slug === slug && b.slug !== ignoreSlug)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export default function Create() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [icons, setIcons] = useState([]);
  const [currentSlug, setCurrentSlug] = useState(null);
  const [loadOpen, setLoadOpen] = useState(false);
  const [status, setStatus] = useState(null);
  const loadRef = useRef(null);

  const builds = getSnapshot();

  // Close the Load menu on outside click / Escape
  useEffect(() => {
    if (!loadOpen) return;
    const onDown = (e) => {
      if (loadRef.current && !loadRef.current.contains(e.target)) setLoadOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setLoadOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [loadOpen]);

  function handleSave() {
    const name = title.trim();
    if (!name) {
      setStatus({ type: 'error', text: 'Give your build a name first.' });
      return;
    }

    const existing = getSnapshot();
    const slug = currentSlug ?? uniqueSlug(slugify(name), existing);
    const build = { slug, name, icons, updatedAt: Date.now() };

    const next = existing.some((b) => b.slug === slug)
      ? existing.map((b) => (b.slug === slug ? build : b))
      : [...existing, build];

    try {
      saveBuilds(next);
      setCurrentSlug(slug);
      setStatus({ type: 'ok', text: 'Saved.' });
    } catch {
      setStatus({ type: 'error', text: "Couldn't save — storage may be full." });
    }
  }

  function handleLoad(build) {
    setTitle(build.name);
    setIcons(build.icons ?? []);
    setCurrentSlug(build.slug);
    setLoadOpen(false);
    setStatus(null);
  }

  function handleAddSkills() {
    // TODO: open the boon/weapon picker
  }

  return (
    <div>
      <Header />
      <main>
        <div className="board-toolbar">
          <input
            className="board-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter Title"
            aria-label="Build title"
            spellCheck={false}
          />

          <div className="toolbar-actions">
            <button type="button" className="board-button" onClick={handleAddSkills}>
              Add Skills
            </button>

            <button type="button" className="board-button" onClick={handleSave}>
              Save Build
            </button>

            <div className="load-wrap" ref={loadRef}>
              <button
                type="button"
                className="board-button"
                onClick={() => setLoadOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={loadOpen}
              >
                Load Build
              </button>

              {loadOpen && (
                <ul className="load-menu" role="menu">
                  {builds.length === 0 ? (
                    <li className="load-empty">No saved builds</li>
                  ) : (
                    builds.map((b) => (
                      <li key={b.slug}>
                        <button
                          type="button"
                          role="menuitem"
                          className="load-item"
                          onClick={() => handleLoad(b)}
                        >
                          {b.name}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>

        {status && (
          <p className={`board-status ${status.type}`} role="status">
            {status.text}
          </p>
        )}

        <div className="board" />
      </main>
    </div>
  );
}