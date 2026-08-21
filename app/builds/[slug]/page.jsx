'use client';

import React, { useSyncExternalStore } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from "@/components/Header";
import Link from 'next/link';
import Image from 'next/image';
import { subscribe, getSnapshot, getServerSnapshot, deleteBuild } from '@/lib/buildsStore';

export default function BuildDetail() {
  const { slug } = useParams();
  const router = useRouter();
  const builds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const build = builds.find((b) => b.slug === slug) ?? null;

  if (!build) {
    return (
      <div>
        <Header />
        <main>
          <div className="section">
            <h1>Build not found</h1>
            <div className="content">
              <p>That build doesn&apos;t exist or has been deleted.</p>
              <Link href="/builds">Back to your builds</Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <main>
        <div className="section">
          <h1>{build.name}</h1>
          <div className="content">
            <div className="build-icons">
              {(build.icons ?? []).map((icon) => (
                <figure key={icon.src}>
                  <Image src={icon.src} alt={icon.alt ?? ''} width={96} height={96} />
                  <figcaption>{icon.alt}</figcaption>
                </figure>
              ))}
            </div>

            {build.notes && <p>{build.notes}</p>}

            <div className="build-actions">
              <Link href="/builds">Back to your builds</Link>
              <button
                className="delete-text-button"
                onClick={() => {
                  deleteBuild(build.slug);
                  router.push('/builds');
                }}
              >
                Delete this build
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}