import React from 'react';
import Header from "@/components/Header";
import Link from 'next/link';

export default function Build() {
  return (
    <div>
      <Header />
      <main>
        <div className="section">
          <h1>Your builds</h1>
          <div className="content">
            <div className="empty-state">
              <p>You haven&apos;t created any builds yet.</p>
              <Link href="/create" className="add-button" aria-label="Create a new build">
                <span aria-hidden="true">+</span>
              </Link>
              <p className="hint">Create your first build</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}