import {Festival} from "@/types";
import {useNavigate} from "react-router-dom";

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
};

// Fallback image nếu không tìm thấy
const DEFAULT_FESTIVAL_IMAGE = "/sai_gon.png";

export function FestivalScrollRow({title, festivals, showRanking = false}: FestivalScrollRowProps) {
    const navigate = useNavigate();

    return (
        <section className="scroll-section">
            <h2 className="section-title">{title}</h2>
            <div className="festivals-container">
                {festivals.map((festival, index) => (
                    <div key={festival.id} className="festival-card">
                        {showRanking && <div className="ranking-badge">{index + 1}</div>}

                        {/* Ảnh poster */}
                        <img
                            className="card-image"
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

                        {/* Thông tin mặc định */}
                        <div className="card-info">
                            <h3>{festival.name}</h3>
                            <p>{festival.symbol}</p>
                            <p>{festival.ticketsForSale} vé còn lại</p>
                        </div>

                        {/* Lớp phủ hover với 2 nút */}
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
