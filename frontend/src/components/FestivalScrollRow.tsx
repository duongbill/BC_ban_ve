import {Festival} from "@/types";
import {useNavigate} from "react-router-dom";
import {useRef} from "react";

interface FestivalScrollRowProps {
    title: string;
    festivals: Festival[];
    showRanking?: boolean;
}

// Mapping ảnh banner cho từng festival ID
const FESTIVAL_IMAGES: Record<string, string> = {
    "1": "/sai-gon.jpg", // Sài Gòn
    "2": "/nha-hat.jpg", // Hà Nội
    "3": "/da-nang.jpg", // Đà Nẵng
    "4": "/bieu-dien-nhac-jazz.webp", // Jazz Festival Hà Nội
    "5": "/rock.webp", // Rock Concert Sài Gòn
    "6": "/edm.jpg", // EDM Festival Hồ Chí Minh
    "7": "/acoustic.jpg", // Acoustic Night Đà Lạt
    "8": "/hiphop.jpg", // Hip Hop Show Hà Nội
    "9": "/nhatrang.jpg", // Country Music Fest Nha Trang
    "10": "/hue.jpg", // Classical Music Night Huế
};

// Fallback image nếu không tìm thấy
const DEFAULT_FESTIVAL_IMAGE = "/sai_gon.png";

export function FestivalScrollRow({title, festivals, showRanking = false}: FestivalScrollRowProps) {
    const navigate = useNavigate();
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const scrollAmount = 320; // px mỗi lần click
        scrollRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    return (
        <section className="scroll-section">
            <h2 className="section-title">{title}</h2>

            {/* NÚT TRÁI */}
            <button className="scroll-btn scroll-left" onClick={() => scroll("left")}>
                ‹
            </button>

            {/* NÚT PHẢI */}
            <button className="scroll-btn scroll-right" onClick={() => scroll("right")}>
                ›
            </button>

            <div className="festivals-container" ref={scrollRef}>
                {festivals.map((festival, index) => (
                    <div key={festival.id} className="festival-card">
                        {showRanking && <div className="ranking-badge">{index + 1}</div>}

                        <img className="card-image" src={FESTIVAL_IMAGES[festival.id] || DEFAULT_FESTIVAL_IMAGE} alt={festival.name} />

                        <div className="card-info">
                            <h3>{festival.name}</h3>
                            <p>{festival.symbol}</p>
                            <p>{festival.ticketsForSale} vé còn lại</p>
                        </div>

                        <div className="card-hover-actions">
                            <button className="btn-view-details" onClick={() => navigate(`/festival/${festival.id}`)}>
                                Xem Chi tiết
                            </button>
                            <button
                                className="btn-buy-ticket"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    alert(`Mua vé ${festival.name}`);
                                }}
                            >
                                Mua Vé
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
