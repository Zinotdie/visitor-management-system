import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ThankYouPage.css';

const ThankYouPage = () => {
  const navigate = useNavigate();

  return (
    <div className="thank-you-page">
      <div className="thank-you-container">
        <div className="success-animation">
          <div className="checkmark">✓</div>
        </div>
        
        <h1>Terima Kasih!</h1>
        <p className="thank-you-message">
          Data kunjungan Anda telah berhasil direkam. Terima kasih telah mengunjungi lokasi wisata kami.
        </p>
        
        <div className="thank-you-details">
          <div className="detail-item">
            <span className="detail-label">Status:</span>
            <span className="detail-value success">Berhasil Disimpan</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Waktu:</span>
            <span className="detail-value">{new Date().toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            className="btn primary"
            onClick={() => window.close()}
          >
            🔒 Tutup Halaman
          </button>
          <button 
            className="btn secondary"
            onClick={() => navigate('/')}
          >
            🏠 Halaman Utama
          </button>
        </div>

        <div className="support-info">
          <p>
            <strong>DISBUDPORAPAR Kota Banjarmasin</strong><br />
            Untuk informasi lebih lanjut, hubungi kami di:<br />
            📞 (0511) 1234567 | 📧 disbudpar@banjarmasin.go.id
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;