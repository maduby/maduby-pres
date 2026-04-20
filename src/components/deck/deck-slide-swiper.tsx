"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { Swiper as SwiperClass } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Slides } from "@/lib/deck/schema";
import { SlideRenderer } from "@/components/deck/slide-renderer";

import "swiper/css";

interface DeckSlideSwiperProps {
  slides: Slides;
  activeIndex: number;
  onNavigate: (index: number) => void;
  /** When true, swipe and slide changes are disabled (lobby / locked deck). */
  navigationLocked?: boolean;
}

export function DeckSlideSwiper({
  slides,
  activeIndex,
  onNavigate,
  navigationLocked = false,
}: DeckSlideSwiperProps) {
  const swiperRef = useRef<SwiperClass | null>(null);
  const activeIndexRef = useRef(activeIndex);

  useLayoutEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const sw = swiperRef.current;
    if (!sw || sw.destroyed) return;
    if (sw.activeIndex === activeIndex) return;
    sw.slideTo(activeIndex, 0, false);
  }, [activeIndex]);

  return (
    <Swiper
      className="deck-swiper h-full w-full"
      nested
      slidesPerView={1}
      speed={320}
      resistanceRatio={0.85}
      threshold={8}
      allowTouchMove={!navigationLocked}
      allowSlideNext={!navigationLocked}
      allowSlidePrev={!navigationLocked}
      simulateTouch={!navigationLocked}
      onSlideChange={(sw) => {
        if (navigationLocked) return;
        if (sw.activeIndex === activeIndexRef.current) return;
        onNavigate(sw.activeIndex);
      }}
      onSwiper={(sw) => {
        swiperRef.current = sw;
      }}
    >
      {slides.map((slide, i) => (
        <SwiperSlide
          key={slide.id ?? `${slide.kind}-${i}`}
          className="deck-swiper-slide !flex h-full min-h-0 !flex-col overflow-hidden"
        >
          <div
            className="deck-swiper-slide-scroll box-border flex min-h-0 w-full flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain px-3 py-3 [-webkit-overflow-scrolling:touch] sm:px-4 sm:py-4 md:px-6 md:py-4 xl:px-7 xl:py-5"
            style={{ touchAction: "pan-y" }}
          >
            <div className="flex min-h-0 w-full flex-1 flex-col justify-start">
              <SlideRenderer
                slide={slide}
                slideIndex={i}
                activeSlideIndex={activeIndex}
              />
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
