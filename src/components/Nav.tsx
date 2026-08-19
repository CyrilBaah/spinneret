"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Feed" },
  { href: "/silk", label: "Silk" },
  { href: "/how", label: "How it wins" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="nav">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={path === link.href ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
