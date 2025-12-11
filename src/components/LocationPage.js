import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './LocationPage.css';

const LocationPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocationInfo();
  }, [code]);

  const fetchLocationInfo = async () => {
    try {
      // Load from localStorage
      const savedLocations = localStorage.getItem('tourism_locations');
      if (savedLocations) {
        const locations = JSON.parse(savedLocations);
        const currentLocation = locations.find(loc => loc.location_code === code);
        if (currentLocation) {
          setLocation(currentLocation);
        } else {
          // Jika lokasi tidak ditemukan
          setLocation({ 
            name: `Lokasi ${code}`, 
            address: 'Lokasi wisata ini belum terdaftar dalam sistem',
            is_active: false
          });
        }
      } else {
        // HAPUS DATA DUMMY - Array kosong
        const defaultLocations = {};
        if (defaultLocations[code]) {
          setLocation(defaultLocations[code]);
        } else {
          setLocation({ 
            name: `Lokasi ${code}`, 
            address: 'Lokasi wisata ini belum terdaftar dalam sistem',
            is_active: false
          });
        }
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      setLocation({ 
        name: 'Error', 
        address: 'Terjadi kesalahan saat memuat data lokasi',
        is_active: false
      });
    } finally {
      setLoading(false);
    }
  };

  const formTypes = [
    {
      type: 'individual',
      title: 'Form Individu',
      description: 'Untuk pengunjung perorangan',
      icon: '👤',
      color: '#667eea'
    },
    {
      type: 'group',
      title: 'Form Grup',
      description: 'Untuk rombongan pengunjung',
      icon: '👥',
      color: '#764ba2'
    },
    {
      type: 'foreign',
      title: 'Form Mancanegara',
      description: 'Untuk wisatawan asing',
      icon: '🌍',
      color: '#f093fb'
    }
  ];

  if (loading) {
    return (
      <div className="location-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Memuat informasi lokasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="location-page">
      <div className="location-header">
        <div className="header-content">
          <Link to="/" className="back-home">
            ← Kembali ke Halaman Utama
          </Link>
          <div className="location-info">
            <h1>Selamat Datang di</h1>
            <h2>{location.name}</h2>
            <p className="location-address">
              <span className="icon">📍</span>
              {location.address}
            </p>
            {!location.is_active && location.is_active !== undefined && (
              <div className="location-status inactive">
                ⚠️ Lokasi ini belum aktif. Silakan hubungi administrator.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="form-selection">
        <div className="selection-header">
          <h3>Silakan Pilih Jenis Form</h3>
          <p>Pilih jenis form yang sesuai dengan kategori pengunjung Anda</p>
        </div>

        <div className="form-options">
          {formTypes.map((form) => (
            <div
              key={form.type}
              className="form-option"
              onClick={() => navigate(`/visitor-form/${code}/${form.type}`)}
              style={{ '--accent-color': form.color }}
            >
              <div className="form-icon" style={{ backgroundColor: form.color }}>
                {form.icon}
              </div>
              <div className="form-content">
                <h4>{form.title}</h4>
                <p>{form.description}</p>
              </div>
              <div className="form-arrow">→</div>
            </div>
          ))}
        </div>
      </div>

      <div className="location-footer">
        <div className="footer-content">
          <div className="footer-logo">🏛️</div>
          <div className="footer-text">
            <strong>DISBUDPORAPAR Kota Banjarmasin</strong>
            <span>Sistem Rekapitulasi Pengunjung Wisata</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPage;