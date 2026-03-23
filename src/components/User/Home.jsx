import React from "react";
import { Hero } from "../../pages/Hero";
import { FeatureGems } from "../../pages/FeatureGems";
import { HowItWorks } from "../../pages/HowItWork";
import { CTA } from "../../pages/CTA";
import { Footer } from "../../pages/Footer";

export default function Home() {
  return (
    <div className="font-sans">

      {/* HERO */}
      <section id="home" className="scroll-mt-20">
        <Hero />
      </section>

      {/* FEATURED */}
      <section id="featured" className="scroll-mt-20">
        <FeatureGems />
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="scroll-mt-20">
        <HowItWorks />
      </section>

      {/* CTA */}
      <section id="cta" className="scroll-mt-20">
        <CTA />
      </section>

      {/* FOOTER */}
      <Footer />

    </div>
  );
}