import React from "react";
import Header from "@/components/Header";
import Link from "next/link";
import { view } from "framer-motion/client";
import Image from "next/image";
import { featuredBuilds } from "@/data/js/featuredBuilds";

export default function Home() {
  return (
    <div>
      <Header />
      <main>
        {/* Welcome */}
        <div className="section">
          <h1>Welcome to Hades Build Tracker</h1>
          <div className="content">
            <p>
              This site provides a tool which you can use to keep track of
              previous builds, as well as and plan out your next Hades run, as
              well as read up on any boon, weapon, item in the game. To get
              started, make sure you check out the{" "}
              <Link href="/tutorial">Tutorial</Link>. Check out my other (more
              recent) projects on my{""}
              <a
                href="https://github.com/ayoajimuda"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              .
            </p>
          </div>
        </div>

        {/* Cool Builds */}
        <div className="section">
          <h1>Personal Builds</h1>
          <div className="builds-content">
            <p>
              You can find the builds you make on the builds page. Here are some
              cool builds I&apos;ve made:
            </p>

            <div className="preview-grid">
              {featuredBuilds.map((build) => (
                <Link
                  href={`/builds/${build.slug}`}
                  className="preview"
                  key={build.slug}
                >
                  <p className="title">{build.name}</p>

                  <ul className="preview-icons">
                    {build.icons.map((icon) => (
                      <li key={icon.src}>
                        <Image src={icon.src} alt="" width={75} height={75} />
                        <div className="icon-text">
                          <span className="icon-name">{icon.name}</span>
                          {icon.detail && (
                            <span className="icon-detail">{icon.detail}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="section">
          <h1>Disclaimer</h1>
          <div className="content">
            <p>
              In order for the tool to work at all you need to have{" "}
              <em>JavaScript</em> enabled.
            </p>
            <p>
              Furthermore, this tool might not work properly on every browser.
              Make sure you have the latest version of Chromium installed on
              your machine.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
