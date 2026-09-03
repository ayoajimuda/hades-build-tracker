"use client";

import React, { useSyncExternalStore } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import Image from "next/image";
import "../../styles/builds.css";
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  deleteBuild,
} from "@/lib/buildsStore";

export default function Builds() {
  const builds = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return (
    <div>
      <Header />
      <main>
        <div className="section">
          <h1>Your builds</h1>
          {builds.length === 0 ? (
            <div className="empty-state">
              <p>You haven&apos;t created any builds yet.</p>
              <Link
                href="/create"
                className="add-button"
                aria-label="Create a new build"
              >
                <span aria-hidden="true">+</span>
              </Link>
              <p className="hint">Create your first build</p>
            </div>
          ) : (
            <div className="preview-grid">
              {builds.map((build) => (
                <div className="preview" key={build.slug}>
                  <button
                    className="delete-button"
                    onClick={() => deleteBuild(build.slug)}
                    aria-label={`Delete ${build.name}`}
                  >
                    <span aria-hidden="true">×</span>
                  </button>

                  <Link href={`/builds/${build.slug}`} className="preview-link">
                    <p className="title">{build.name}</p>
                    <div className="preview-icons">
                      {(build.icons ?? []).slice(0, 3).map((icon) => (
                        <Image
                          key={icon.src}
                          src={icon.src}
                          alt={icon.alt ?? ""}
                          width={64}
                          height={64}
                        />
                      ))}
                    </div>
                  </Link>
                </div>
              ))}

              <Link
                href="/create"
                className="preview add-tile"
                aria-label="Create a new build"
              >
                <span aria-hidden="true">+</span>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
