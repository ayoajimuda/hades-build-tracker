"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "../styles/header.css";

const links = [
  { href: "/", label: "Home" },
  { href: "/builds", label: "Builds" },
  { href: "/tutorial", label: "Tutorial" },
  { href: "/create", label: "Create", right: true },
];

const Header = () => {
  const pathname = usePathname();

  return (
    <header className="header">
      <nav className="navbar" aria-label="Main">
        <ul>
          {links.map(({ href, label, right }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <li key={href} className={right ? "right" : undefined}>
                <Link
                  href={href}
                  className={isActive ? "active" : undefined}
                  aria-current={isActive ? "page" : undefined}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
