export const dynamic = "force-dynamic";
export const revalidate = 0;

import Atlas3DTrackerWrapper from "@/components/Atlas3DTrackerWrapper";
import FeaturedRow from "@/components/FeaturedRow";
import FlightpathSimulator from "@/components/FlightpathSimulator";
import SocialLinks from "@/components/SocialLinks";

const BASES = {
  atlas: process.env.NEXT_PUBLIC_3IATLAS_BASE || "",
  arcana: process.env.NEXT_PUBLIC_ARCANA_BASE || "",
  edm: process.env.NEXT_PUBLIC_EDM_BASE || "",
  bday: process.env.NEXT_PUBLIC_BDAY_BASE || "",
};

export default async function Page() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 text-white">
      {/* HERO */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-black/20 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">3I/ATLAS FLIGHTPATH</h1>
          <a
            className="rounded-md bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
            href="#brands"
          >
            Explore brands
          </a>
        </div>
        <p className="mt-2 text-white/80">
          Live drops from four Printify outposts.
        </p>
        <div className="mt-6">
          <FlightpathSimulator seed="3iatlas" />
        </div>
      </section>

      {/* 3D ORBITAL TRACKER */}
      <section className="mt-10">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-black/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">3D Orbital Tracker</h2>
              <p className="text-white/60 text-sm mt-1">
                Watch 3I/ATLAS approach perihelion in October 2025
              </p>
            </div>
          </div>
          <div className="h-[700px] rounded-xl relative">
            <Atlas3DTrackerWrapper
              startDate="2025-10-01"
              endDate="2025-10-31"
              stepSize="6h"
              autoPlay={true}
              playbackSpeed={2}
            />
          </div>
          <div className="mt-4 text-center text-white/40 text-sm">
            🌌 Orbital data provided by NASA Jet Propulsion Laboratory
          </div>
        </div>
      </section>

      {/* UNIVERSE / BRANDS */}
      <section id="brands" className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">Explore Our Universe</h2>

        {/* 3I Atlas — no socials */}
        <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4">
          <a
            href={BASES.atlas}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-3 text-lg font-semibold hover:text-white/80 transition-colors w-fit"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/3iAtlas_Logo.png"
              alt="3I/Atlas Logo"
              className="h-8 w-8 rounded-md object-contain"
            />
            3I/Atlas
          </a>
          <FeaturedRow storeBase={BASES.atlas} />
        </div>

        {/* Mystic Arcana */}
        <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4">
          <a
            href="https://mysticarcana.com"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-3 text-lg font-semibold hover:text-white/80 transition-colors w-fit"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/Mystic_Arcana_Logo.png"
              alt="Mystic Arcana Logo"
              className="h-8 w-8 rounded-md object-contain"
            />
            Mystic Arcana
          </a>
          <div className="flex items-center gap-2 mt-1">
            <SocialLinks brand="mysticArcana" />
            <a
              href={BASES.arcana}
              target="_blank"
              rel="noopener"
              className="rounded-md bg-white/10 px-3 py-1 text-xs hover:bg-white/20 transition-colors whitespace-nowrap"
            >
              Mystic Marketplace
            </a>
          </div>
          <FeaturedRow storeBase={BASES.arcana} />
        </div>

        {/* EDM Shuffle */}
        <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4">
          <a
            href="https://edmshuffle.com"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-3 text-lg font-semibold hover:text-white/80 transition-colors w-fit"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/EDM_Shuffle_Logo.png"
              alt="EDM Shuffle Logo"
              className="h-8 w-8 rounded-md object-contain"
            />
            EDM Shuffle
          </a>
          <div className="flex items-center gap-2 mt-1">
            <SocialLinks brand="edmShuffle" />
            <a
              href={BASES.edm}
              target="_blank"
              rel="noopener"
              className="rounded-md bg-white/10 px-3 py-1 text-xs hover:bg-white/20 transition-colors whitespace-nowrap"
            >
              Shuffle Shop
            </a>
          </div>
          <FeaturedRow storeBase={BASES.edm} />
        </div>

        {/* BirthdayGen */}
        <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4">
          <a
            href="https://birthdaygen.com"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-3 text-lg font-semibold hover:text-white/80 transition-colors w-fit"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/birthday-gen-logo.png"
              alt="BirthdayGen Logo"
              className="h-8 w-8 rounded-md object-contain"
            />
            BirthdayGen
          </a>
          <div className="flex items-center gap-2 mt-1">
            <SocialLinks brand="birthdayGen" />
            <a
              href={BASES.bday}
              target="_blank"
              rel="noopener"
              className="rounded-md bg-white/10 px-3 py-1 text-xs hover:bg-white/20 transition-colors whitespace-nowrap"
            >
              Gift Shop
            </a>
          </div>
          <FeaturedRow storeBase={BASES.bday} />
        </div>
      </section>

      {/* ATLAS DIRECTIVE — narrative game teaser */}
      <section className="mt-10">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-black/20 p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">ATLAS DIRECTIVE</h2>
            <p className="text-white/80 mb-6">
              Experience the narrative game that follows 3I/ATLAS's journey
              through our solar system.
            </p>
            <a
              href="#"
              className="inline-block rounded-md bg-white/10 px-6 py-3 text-sm hover:bg-white/20 transition-colors"
            >
              Coming Soon - Play the Game
            </a>
          </div>
        </div>
      </section>

      {/* BOTTOM STORE BAND with EYE image */}
      <section className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6">
        <a
          href={BASES.atlas}
          target="_blank"
          rel="noopener"
          className="mb-3 flex items-center gap-3 hover:opacity-80 transition-opacity w-fit"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/3iAtlas_Logo.png"
            alt="3I/Atlas Logo"
            className="h-8 w-8 rounded-md object-contain"
          />
          <h3 className="text-lg font-semibold">3I/Atlas Store</h3>
        </a>
        <FeaturedRow storeBase={BASES.atlas} />
      </section>
    </main>
  );
}
