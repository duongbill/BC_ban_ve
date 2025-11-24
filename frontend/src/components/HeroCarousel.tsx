import { useState, useEffect } from "react";
import { Festival } from "@/types";
import { useNavigate } from "react-router-dom";

interface HeroCarouselProps {
  festivals: Festival[];
}

export function HeroCarousel({ festivals }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const featuredFestivals = festivals.slice(0, 3);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredFestivals.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredFestivals.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="hero-carousel">
      <div
        className="carousel-track"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {featuredFestivals.map((festival) => (
          <div
            key={festival.id}
            className="carousel-slide"
            onClick={() => navigate(`/festival/${festival.id}`)}
          >
            <div className="slide-image">
              <img src="/trai.png" alt={festival.name} />
            </div>
            <div className="slide-content">
              <h1 className="slide-title">{festival.name}</h1>
              <p className="slide-subtitle">{festival.symbol}</p>
              <div className="slide-stats">
                <span>Tổng vé: {festival.totalTickets.toLocaleString()}</span>
                <span className="divider">•</span>
                <span>Còn lại: {festival.ticketsForSale}</span>
              </div>
              <button className="slide-button">Xem chi tiết</button>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Dots */}
      <div className="carousel-dots">
        {featuredFestivals.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentSlide ? "active" : ""}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
