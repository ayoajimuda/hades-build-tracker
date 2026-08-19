import React from 'react';
import Header from "@/components/Header";
import Link from 'next/link';
import { view } from 'framer-motion/client';
import Image from 'next/image';

export default async function Home() {

  return (
    <div>
        <Header/>
        <main>
        {/* Welcome */}
            <div className="section">
                <h1>Welcome to hades-build-tracker.com</h1>
                <div className="content">
                    <p>
                        This site provides a tool which you can use to keep track 
                        and plan out your next Hades run, 
                        as well as read up on any boon, weapon, item in the game. 
                        To get started, make sure you check out the{' '}
                        <Link href="/tutorial">tutorial</Link>
                    </p>
                    <p>
                        Check out my other (more recent) projects on my{' '} <a href="https://github.com/ayoajimuda" target="_blank" rel="noopener noreferrer">GitHub</a>.
                    </p>
                </div>
            </div>

        {/* Cool Builds */}
            <div className="section">
                <h1>Personal Builds </h1>
                <div className="content">
                    <p>
                        You can find the builds you make on the builds page. 
                        Here are some cool builds I;ve made:
                    </p>

                    <div className="preview-grid">
                        <div className="preview">
                            <p className="title">Life Theft</p>
                            <Image src="/img/Builds/Life_Theft/Aspect_of_Guan_Yu.webp" alt="Aspect of Guan Yu" width={200} height={200}/>
                            <Image src="/img/Builds/Life_Theft/Aspect_of_Guan_Yu.webp" alt="Aspect of Guan Yu" width={200} height={200}/>
                            <Image src="/img/Builds/Life_Theft/Aspect_of_Guan_Yu.webp" alt="Aspect of Guan Yu" width={200} height={200}/>
                        </div>
                    </div>
                </div>
            </div>

        {/* Disclaimer */}
            <div className="section">
                <h1>Disclaimer</h1>
                <div className="content">
                    <p>
                        In order for the tool to work at all you need to have <em>JavaScript</em> enabled.
                    </p>
                    <p>
                        Furthermore, this tool might not work properly on every browser. 
                        Make sure you have the latest version of Chromium installed on your machine.
                    </p>
                </div>
            </div>
        </main>
    </div>
  );
}