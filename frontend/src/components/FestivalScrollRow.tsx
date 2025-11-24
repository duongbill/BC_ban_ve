import { Festival } from "@/types";
import { useNavigate } from "react-router-dom";

interface FestivalScrollRowProps {
  title: string;
  festivals: Festival[];
  showRanking?: boolean;
}

export function FestivalScrollRow({
  title,
  festivals,
  showRanking = false,
}: FestivalScrollRowProps) {
  const navigate = useNavigate();

  return (
    <section className="scroll-section">
      <h2 className="section-title">{title}</h2>
      <div className="festivals-container">
        {festivals.map((festival, index) => (
          <div key={festival.id} className="festival-card">
            {showRanking && <div className="ranking-badge">{index + 1}</div>}

            {/* Ảnh poster */}
            <img className="card-image" src="/trai.png" alt={festival.name} />

            {/* Thông tin mặc định */}
            <div className="card-info">
              <h3>{festival.name}</h3>
              <p>{festival.symbol}</p>
              <p>{festival.ticketsForSale} vé còn lại</p>
            </div>

            {/* Lớp phủ hover với 2 nút */}
            <div className="card-hover-actions">
              <button
                className="btn-view-details"
                onClick={() => navigate(`/festival/${festival.id}`)}
              >
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
