import React from 'react';
import Link from 'next/link';

const Header = () => {
    return (
        <header className="header">
            <nav className="navbar">
                <ul>
                    <li><Link href="/"></Link>Home</li>
                    <li><Link href="/builds">Builds</Link></li>
                    <li><Link href="/tutorial">Tutorial</Link></li>
                    <li><Link href="/create">Create</Link></li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;