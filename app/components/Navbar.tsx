"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/reservar", label: "Reservas" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-display text-3xl font-bold tracking-tight text-wine sm:text-4xl"
        >
          esma
        </Link>

        {/* Menú escritorio */}
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-wine text-white"
                      : "text-ink/80 hover:bg-beige hover:text-wine"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Botón móvil */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
          className="grid h-10 w-10 place-items-center rounded-lg border border-line md:hidden"
        >
          <span className="text-xl leading-none text-wine">{open ? "✕" : "☰"}</span>
        </button>
      </nav>

      {/* Menú móvil */}
      {open && (
        <ul className="flex flex-col gap-1 border-t border-line px-6 py-3 md:hidden">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-4 py-3 text-sm font-medium ${
                    active ? "bg-wine text-white" : "text-ink/80 hover:bg-beige"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </header>
  );
}
