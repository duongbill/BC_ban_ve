import {useState, useEffect} from "react";
import {Festival} from "@/types";
import {useNavigate} from "react-router-dom";

interface HeroCarouselProps {
    festivals: Festival[];
}

// Mapping ảnh banner cho từng festival ID
const FESTIVAL_IMAGES: Record<string, string> = {
    "1": "/sai-gon-banner.webp", // Sài Gòn
    "2": "/nha-hat-lon-ha-noi-banner.jpg", // Hà Nội
    "3": "/da-nang-banner.jpg", // Đà Nẵng
    "4": "/trai.png", // Jazz Festival Hà Nội
    "5": "/trai.png", // Rock Concert Sài Gòn
    "6": "/trai.png", // EDM Festival Hồ Chí Minh
    "7": "/trai.png", // Acoustic Night Đà Lạt
    "8": "/trai.png", // Hip Hop Show Hà Nội
    "9": "/trai.png", // Country Music Fest Nha Trang
    "10": "/trai.png", // Classical Music Night Huế
};

// Fallback image nếu không tìm thấy
const DEFAULT_FESTIVAL_IMAGE = "/trai.png";

export function HeroCarousel({festivals}: HeroCarouselProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();
    const featuredFestivals = festivals.slice(0, 4);

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
            <div className="carousel-track" style={{transform: `translateX(-${currentSlide * 100}%)`}}>
                {featuredFestivals.map((festival) => (
                    <div key={festival.id} className="carousel-slide" onClick={() => navigate(`/festival/${festival.id}`)}>
                        <div className="slide-image">
                            <img
                                src={FESTIVAL_IMAGES[festival.id] || DEFAULT_FESTIVAL_IMAGE}
                                alt={festival.name}
                                onError={(e) => {
                                    // Fallback to default image if custom image fails to load
                                    const target = e.target as HTMLImageElement;
                                    if (target.src !== `${window.location.origin}${DEFAULT_FESTIVAL_IMAGE}`) {
                                        target.src = DEFAULT_FESTIVAL_IMAGE;
                                    }
                                }}
                            />
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
