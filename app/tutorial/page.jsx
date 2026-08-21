import React from 'react';
import Header from "@/components/Header";
import Link from 'next/link';
import { view } from 'framer-motion/client';
import Image from 'next/image';

export default async function Tutorial() {

    return (
        <div>
            <Header/>
        <main>
            <div className="section">
            <h1>How to get started</h1>
            <div className="content">
               <p>
                  Click on Create Build in the top
                  right corner. You will land on a page I call the <em>Build Board</em>. This will be the place you create your
                  build. To get started do the following:
               </p>
               <ul>
                  <li>
                     Click on <em>Enter Title</em> and give your build a name.
                  </li>
                  <li>
                     Use <em>Ctrl + Scroll</em> to zoom as you like. I usually
                     keep it around 80-90%.
                  </li>
               </ul>
            </div>
         </div>

         {/*Build Board */}
         <div className="section">
            <h1>Build Board</h1>
            <div className="content">
               <p>
                  On the build board you can click down the <em>scroll wheel</em> to move around. At the top you will find
                  six <em>buttons</em>. Those do the following:
               </p>
               <ul>
                  <li>
                     <em>Add Section</em>: Adds a new empty section to the build
                     board.
                  </li>
                  <li>
                     <em>Add Skill</em>: Opens up the <em>Skill Selection</em>
                     to add new skills.
                  </li>
                  <li>
                     <em>Fit Sections</em>: Arranges all sections to fit nicely
                     on the build board.
                  </li>
                  <li>
                     <em>Save Build</em>: Downloads a .json file containing your
                     build.
                  </li>
                  <li>
                     <em>Load Build</em>: Asks for a .json file containing a
                     build to load.
                  </li>
                  <li>
                     <em>Sidebar</em>: Opens up or closes down the
                     <em>Sidebar</em>.
                  </li>
               </ul>
            </div>
         </div>
         {/* Skills Selection */}
         <div className="section">
            <h1>Skill Selection</h1>
            <div className="content">
               <p>
                  This is the second page you can be on (besides the build
                  board). Here you can <em>left-click</em> on a skill to add it
                  to your <em>Skill Cache</em>, or <em>right-click</em> on it to
                  show more <em>information</em>.
               </p>
               <p>
                  At the top you will find 2 <em>buttons</em> and a <em>search bar</em>. Those do the following:
               </p>
               <ul>
                  <li>
                     <em>Go Back</em>: Brings you back to the build board page.
                  </li>
                  <li>
                     <em>Filter</em>: Opens up the <em>filter settings</em>.
                  </li>
                  <li>
                     <em>Searchbar</em>: Lets you search for specific skills.
                  </li>
               </ul>
            </div>
         </div>
         
         {/* Sidebar */}
         <div className="section">
            <h1>Sidebar</h1>
            <div className="content">
               <p>
                  The sidebar consists of <em>two segments</em> which serve the
                  following purposes:
               </p>
               <ul>
                  <li>
                     <em>Skill Info</em>: Shows additional
                     <em>information</em> about a skill and its <em>requirements</em>.
                  </li>
                  <li>
                     <em>Skill Cache</em>: Holds new skills from the skill
                     selection.
                  </li>
               </ul>
               <p>
                  By <em>left-clicking</em> on a skill shown as requirement, you
                  can add it directly to your skill cache.Also in the middle of
                  the two segments is a <em>divider</em> you can freely adjust.
               </p>
            </div>
         </div>

         {/* Section & Skills */}
         <div className="section">
            <h1>Sections and Skills</h1>
            <div className="content">
               <p>
                  You can <em>move</em> a section around by <em>grabbing</em> it
                  at the top. You will see your cursor change when this is
                  possible. On the bottom right corner you can <em>resize</em> a
                  section by <em>grabbing</em> it. Doing so will always snap
                  back to the current layout of the skills inside it.
               </p>
               <p>
                  You can change the <em>rarity</em> or the <em>rank</em> of a
                  skill by <em>left-clicking</em> on it. You can <em>move</em> a
                  skill by <em>grabbing</em> it. To see more <em>information</em> about a skill <em>right-click</em> it. A
                  skill can be a boon, item, weapon, mirror upgrade, or heat
                  setting.
               </p>
            </div>
         </div>

         {/* Filter Settings */}
         <div className="section">
            <h1>Filter Settings</h1>
            <div className="content">
               <p>
                  The filter settings consist of <em>five categories</em>. Those
                  are as follows:
               </p>
               <ul>
                  <li>
                     <em>General</em>: Choose the general <em>category</em> of
                     skills you want to see.
                  </li>
                  <li>
                     <em>Gods</em>: Choose from which gods you want to see the
                     boons.
                  </li>
                  <li>
                     <em>Boons</em>: Choose <em>special kinds</em> of boons to
                     show.
                  </li>
                  <li>
                     <em>Weapons</em>: Choose which weapons you want to see.
                  </li>
                  <li>
                     <em>Items</em>: Choose <em>special kinds</em> of items to
                     show.
                  </li>
               </ul>
               <p>
                  Each <em>line</em> line you see, will add filters with a <em>logical and</em>, while filters inside the same block will
                  be added with a <em>logical or</em>. Also not choosing <em>anything</em> inside a block is the same as choosing <em>everything</em> in that block.
               </p>
            </div>
         </div>
        </main>
      </div>

    );
}