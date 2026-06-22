"use client";

import { useState } from "react";
import { situations } from "@/data/site";

export default function SituationsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="relative overflow-hidden bg-navy navy-tufting-texture py-24 text-white md:py-32">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="font-serif text-3xl tracking-tight text-white md:text-5xl">
            We partner with businesses at pivotal moments.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-white/75 md:text-lg">
            Select your situation to see how MDC can support your next stage of
            growth, transition, or building.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          <div className="flex flex-col gap-3 lg:col-span-2">
            {situations.map((situation, index) => {
              const active = index === activeIndex;
              return (
                <button
                  key={situation.quote}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`rounded-xl border px-5 py-4 text-left transition-all duration-300 ${
                    active
                      ? "border-mdc-blue bg-white shadow-md"
                      : "border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`font-serif text-lg md:text-xl ${
                      active ? "text-navy" : "text-white/85"
                    }`}
                  >
                    &ldquo;{situation.quote}&rdquo;
                  </span>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-navy/8 bg-white p-8 shadow-sm lg:col-span-3 lg:p-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-mdc-blue">
              How we help
            </p>
            <h3 className="mt-4 font-serif text-2xl text-navy md:text-3xl">
              &ldquo;{situations[activeIndex].quote}&rdquo;
            </h3>
            <p className="mt-6 text-base leading-relaxed text-slate md:text-lg">
              {situations[activeIndex].body}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
