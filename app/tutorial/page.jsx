import React from "react";
import Header from "@/components/Header";
import Link from "next/link";
import { view } from "framer-motion/client";
import Image from "next/image";

export default async function Tutorial() {
  return (
    <div>
      <Header />
      <main>
        <div className="section">
          <h1>How to get started</h1>
          <div className="content">
            <p>
              Click on Create in the top right corner. You will land on a page I
              call the <em>Build Board</em>. This will be the place you create
              your build. To get started do the following:
            </p>
            <ul>
              <li>
                Click on <em>Enter Title</em> and give your build a name.
              </li>
              <li>
                Use <em>Ctrl + Scroll</em> to zoom as you like. I usually keep
                it around 80-90%.
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
