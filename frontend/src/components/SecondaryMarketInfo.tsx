import React from "react";
import { Festival } from "@/types";

interface SecondaryMarketInfoProps {
  festival: Festival;
}

export const SecondaryMarketInfo: React.FC<SecondaryMarketInfoProps> = ({
  festival,
}) => {
  const maxTickets = festival.maxTicketsPerWallet || 0;
  const maxResale = festival.maxResalePercentage || 110;
  const royalty = festival.royaltyPercentage || 5;

  return (
    <div className="secondary-market-info">
      <h3 className="section-title">
        🛡️ Chính sách Kiểm soát Thị trường Chuyển nhượng
      </h3>

      <div className="info-grid">
        {/* Anti-Scalping */}
        <div className="info-card">
          <div className="info-icon">🚫</div>
          <div className="info-content">
            <h4>Chống Đầu cơ</h4>
            <p className="info-label">Giới hạn vé/ví:</p>
            <p className="info-value">
              {maxTickets === 0 ? "Không giới hạn" : `${maxTickets} vé`}
            </p>
            <p className="info-description">
              {maxTickets === 0
                ? "Người dùng có thể mua nhiều vé tùy ý"
                : `Mỗi ví chỉ được sở hữu tối đa ${maxTickets} vé để chống đầu cơ`}
            </p>
          </div>
        </div>

        {/* Price Ceiling */}
        <div className="info-card">
          <div className="info-icon">📊</div>
          <div className="info-content">
            <h4>Áp Trần Giá</h4>
            <p className="info-label">Giá bán lại tối đa:</p>
            <p className="info-value">{maxResale}% giá gốc</p>
            <p className="info-description">
              Vé không thể bán lại vượt quá {maxResale}% giá mua ban đầu, ngăn
              chặn "phe vé" đẩy giá
            </p>
          </div>
        </div>

        {/* Royalty */}
        <div className="info-card">
          <div className="info-icon">💰</div>
          <div className="info-content">
            <h4>Hoa Hồng BTC</h4>
            <p className="info-label">Phần trăm royalty:</p>
            <p className="info-value">{royalty}%</p>
            <p className="info-description">
              Ban tổ chức nhận {royalty}% hoa hồng tự động mỗi khi vé được bán
              lại trên thị trường thứ cấp
            </p>
          </div>
        </div>

        {/* Marketplace Commission */}
        <div className="info-card">
          <div className="info-icon">🏪</div>
          <div className="info-content">
            <h4>Phí Sàn</h4>
            <p className="info-label">Hoa hồng marketplace:</p>
            <p className="info-value">10%</p>
            <p className="info-description">
              Sàn giao dịch thu 10% phí dịch vụ từ mỗi giao dịch bán lại
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Breakdown Example */}
      <div className="transaction-breakdown">
        <h4>📝 Ví dụ Giao dịch Bán lại</h4>
        <div className="breakdown-content">
          <p>
            Giả sử vé giá gốc <strong>100 FEST</strong>, bán lại với giá{" "}
            <strong>110 FEST</strong>:
          </p>
          <div className="breakdown-list">
            <div className="breakdown-item">
              <span>💵 Tổng giá bán:</span>
              <span className="amount">110 FEST</span>
            </div>
            <div className="breakdown-item seller">
              <span>👤 Người bán nhận:</span>
              <span className="amount">93.5 FEST (85%)</span>
            </div>
            <div className="breakdown-item royalty">
              <span>🎭 BTC nhận (royalty):</span>
              <span className="amount">5.5 FEST ({royalty}%)</span>
            </div>
            <div className="breakdown-item commission">
              <span>🏪 Marketplace nhận:</span>
              <span className="amount">11 FEST (10%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="benefits-section">
        <h4>✨ Lợi ích</h4>
        <ul className="benefits-list">
          <li>
            <span className="benefit-icon">✅</span>
            <span>Bảo vệ người hâm mộ khỏi giá vé bị thổi phồng</span>
          </li>
          <li>
            <span className="benefit-icon">✅</span>
            <span>BTC có thêm nguồn thu từ thị trường thứ cấp</span>
          </li>
          <li>
            <span className="benefit-icon">✅</span>
            <span>Ngăn chặn đầu cơ và mua bán vé bất hợp pháp</span>
          </li>
          <li>
            <span className="benefit-icon">✅</span>
            <span>Minh bạch và tự động thông qua Smart Contract</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
