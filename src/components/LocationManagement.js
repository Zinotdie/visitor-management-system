import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRefresh } from "../contexts/RefreshContext";
import { QRCodeCanvas } from "qrcode.react";
import { Link, useNavigate } from "react-router-dom";
import "./LocationManagement.css";

const LocationManagement = () => {
  const { user, token } = useAuth();
  const { triggerRefresh } = useRefresh();
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [visitorsData, setVisitorsData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    location_code: "",
    name: "",
    address: "",
  });
  const [showQR, setShowQR] = useState(null);
  const [selectedFormType, setSelectedFormType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // KEY untuk localStorage
  const VISITOR_STORAGE_KEY = "visitor_management_data";
  const LOCATION_STORAGE_KEY = "tourism_locations";

  // Load locations dan data pengunjung dari localStorage
  useEffect(() => {
    fetchLocations();
    fetchVisitorsData();
  }, []);

  const fetchVisitorsData = () => {
    try {
      const savedVisitors = localStorage.getItem(VISITOR_STORAGE_KEY);
      if (savedVisitors) {
        const parsedVisitors = JSON.parse(savedVisitors);
        setVisitorsData(parsedVisitors);
      } else {
        setVisitorsData([]); // DATA KOSONG
      }
    } catch (error) {
      console.error("Error loading visitors data:", error);
      setVisitorsData([]); // DATA KOSONG
    }
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError("");

      const savedLocations = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (savedLocations) {
        const parsedLocations = JSON.parse(savedLocations);
        setLocations(parsedLocations);
      } else {
        // HAPUS DATA DUMMY DEFAULT
        const defaultLocations = []; // ARRAY KOSONG
        setLocations(defaultLocations);
        localStorage.setItem(
          LOCATION_STORAGE_KEY,
          JSON.stringify(defaultLocations)
        );
      }
    } catch (error) {
      setError("Error loading locations");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk menghitung total pengunjung dari data real
  const calculateTotalVisitors = () => {
    return visitorsData.reduce((total, visitor) => {
      return total + (visitor.male_count || 0) + (visitor.female_count || 0);
    }, 0);
  };

  // Fungsi untuk menghitung total records (jumlah kunjungan)
  const calculateTotalRecords = () => {
    return visitorsData.length;
  };

  // Fungsi untuk menghitung pengunjung per lokasi
  const calculateVisitorsByLocation = useCallback(() => {
    const visitorsByLocation = {};

    visitorsData.forEach((visitor) => {
      const locationCode = visitor.location_code;
      if (!visitorsByLocation[locationCode]) {
        visitorsByLocation[locationCode] = 0;
      }
      visitorsByLocation[locationCode] +=
        (visitor.male_count || 0) + (visitor.female_count || 0);
    });

    return visitorsByLocation;
  }, [visitorsData]);

  // Fungsi untuk update visitor count di setiap lokasi
  const updateLocationsWithRealData = useCallback(() => {
    const visitorsByLocation = calculateVisitorsByLocation();

    setLocations(prevLocations => {
      const updatedLocations = prevLocations.map((location) => ({
        ...location,
        visitor_count: visitorsByLocation[location.location_code] || 0,
      }));

      // Update localStorage dengan data terbaru
      localStorage.setItem(
        LOCATION_STORAGE_KEY,
        JSON.stringify(updatedLocations)
      );

      return updatedLocations;
    });
  }, [calculateVisitorsByLocation]);

  // Update data lokasi dengan data real ketika visitorsData berubah
  useEffect(() => {
    if (visitorsData.length > 0 && locations.length > 0) {
      updateLocationsWithRealData();
    }
  }, [visitorsData, updateLocationsWithRealData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validasi kode lokasi unik
      const existingCode = locations.find(
        (loc) =>
          loc.location_code.toUpperCase() ===
          formData.location_code.toUpperCase()
      );

      if (existingCode) {
        throw new Error("Kode lokasi sudah digunakan");
      }

      if (formData.location_code.length < 2) {
        throw new Error("Kode lokasi minimal 2 karakter");
      }

      const newLocation = {
        id: Date.now(),
        location_code: formData.location_code.toUpperCase(),
        name: formData.name,
        address: formData.address,
        is_active: true,
        visitor_count: 0, // DATA KOSONG
        created_at: new Date().toISOString(),
        created_by: user?.full_name || "admin",
      };

      const updatedLocations = [...locations, newLocation];
      setLocations(updatedLocations);
      localStorage.setItem(
        LOCATION_STORAGE_KEY,
        JSON.stringify(updatedLocations)
      );

      setShowForm(false);
      setFormData({ location_code: "", name: "", address: "" });
      setSuccess("Lokasi berhasil ditambahkan!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.message || "Terjadi kesalahan saat menyimpan lokasi");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = (location, formType = null) => {
    setSelectedFormType(formType);
    setShowQR(location.id);
  };

  const getQRValue = (location, formType) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/visitor-form/${location.location_code}/${formType}`;
  };

  const getFormTypeLabel = (type) => {
    switch (type) {
      case "individual":
        return "Individu";
      case "group":
        return "Grup";
      case "foreign":
        return "Mancanegara";
      default:
        return "Umum";
    }
  };

  const getFormTypeIcon = (type) => {
    switch (type) {
      case "individual":
        return "👤";
      case "group":
        return "👥";
      case "foreign":
        return "🌍";
      default:
        return "📝";
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setFormData({ location_code: "", name: "", address: "" });
    setError("");
  };

  const deleteLocation = async (id) => {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin menghapus lokasi ini? Data yang dihapus tidak dapat dikembalikan."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const updatedLocations = locations.filter(
        (location) => location.id !== id
      );
      setLocations(updatedLocations);
      localStorage.setItem(
        LOCATION_STORAGE_KEY,
        JSON.stringify(updatedLocations)
      );
      setSuccess("Lokasi berhasil dihapus!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Gagal menghapus lokasi");
    } finally {
      setLoading(false);
    }
  };

  const toggleLocationStatus = async (id) => {
    try {
      setLoading(true);
      const updatedLocations = locations.map((location) =>
        location.id === id
          ? { ...location, is_active: !location.is_active }
          : location
      );
      setLocations(updatedLocations);
      localStorage.setItem(
        LOCATION_STORAGE_KEY,
        JSON.stringify(updatedLocations)
      );

      const location = locations.find((loc) => loc.id === id);
      setSuccess(
        `Lokasi ${location.name} ${
          !location.is_active ? "diaktifkan" : "dinonaktifkan"
        }!`
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Gagal mengubah status lokasi");
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = (location, formType) => {
    const canvas = document.getElementById(`qrcode-${location.id}-${formType}`);
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `QR-${location.location_code}-${formType}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  // Refresh semua data
  const refreshAllData = () => {
    fetchLocations();
    fetchVisitorsData();
    setSuccess("Data berhasil di-refresh");
    setTimeout(() => setSuccess(""), 3000);
  };

  // ==================== NAVIGATION ====================
  const handleNavigation = (path) => {
    navigate(path, { 
        state: { 
            refresh: true,
            timestamp: Date.now()
        } 
    });
  };

  // Fungsi untuk mendapatkan statistik per lokasi
  const getLocationStats = (locationCode) => {
    const locationVisitors = visitorsData.filter(
      (v) => v.location_code === locationCode
    );
    const totalVisitors = locationVisitors.reduce(
      (sum, visitor) =>
        sum + (visitor.male_count || 0) + (visitor.female_count || 0),
      0
    );
    const totalRecords = locationVisitors.length;

    // Hitung breakdown per tipe
    const typeBreakdown = {
      individual: 0,
      group: 0,
      foreign: 0,
      domestic: 0,
    };

    locationVisitors.forEach((visitor) => {
      const totalCount =
        (visitor.male_count || 0) + (visitor.female_count || 0);
      const isIndividual = totalCount === 1;
      const isForeign = visitor.visitor_type === "international";

      if (isForeign) {
        typeBreakdown.foreign += totalCount;
      } else {
        typeBreakdown.domestic += totalCount;
      }

      if (isIndividual) {
        typeBreakdown.individual += totalCount;
      } else {
        typeBreakdown.group += totalCount;
      }
    });

    return {
      totalVisitors,
      totalRecords,
      typeBreakdown,
    };
  };

  return (
    <div className="location-management">
      <header className="page-header">
        <div className="header-content">
          <button onClick={() => handleNavigation('/dashboard')} className="back-btn">
            ← Kembali ke Dashboard
          </button>
          <div className="header-title">
            <h1>Kelola Lokasi Wisata</h1>
            <p>Kelola lokasi dan generate QR Code untuk pengunjung</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      {error && (
        <div className="message error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError("")} className="close-btn">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="message success">
          <span>✅ {success}</span>
          <button onClick={() => setSuccess("")} className="close-btn">
            ×
          </button>
        </div>
      )}

      {/* Stats Overview - MENGGUNAKAN DATA REAL DARI VISITOR MANAGEMENT */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">🏛️</div>
          <div className="stat-content">
            <h3>{locations.length}</h3>
            <p>Total Lokasi</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{locations.filter((loc) => loc.is_active).length}</h3>
            <p>Lokasi Aktif</p>
          </div>
        </div>
        <div className="stat-card primary">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{calculateTotalVisitors().toLocaleString()}</h3>
            <p>Total Pengunjung</p>
            <small>{calculateTotalRecords()} kunjungan</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{calculateTotalRecords().toLocaleString()}</h3>
            <p>Total Records</p>
            <small>Data tercatat</small>
          </div>
        </div>
      </div>

      <div className="page-actions">
        <button
          onClick={() => setShowForm(true)}
          className="btn primary"
          disabled={loading}
        >
          ➕ Tambah Lokasi Baru
        </button>
        <button onClick={refreshAllData} className="btn secondary">
          🔄 Refresh Data
        </button>
      </div>

      {/* Add Location Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>➕ Tambah Lokasi Baru</h2>
              <button onClick={handleFormCancel} className="close-btn">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Kode Lokasi *</label>
                <input
                  type="text"
                  value={formData.location_code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location_code: e.target.value.toUpperCase(),
                    })
                  }
                  required
                  placeholder="Contoh: GB, PIP, RA"
                  maxLength="10"
                  pattern="[A-Z0-9]{2,10}"
                  title="Kode lokasi harus 2-10 karakter (huruf/angka)"
                />
                <small>Gunakan kode unik 2-10 karakter (huruf/angka)</small>
              </div>
              <div className="form-group">
                <label>Nama Lokasi *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="Contoh: Gallery Bungas"
                  maxLength="100"
                />
              </div>
              <div className="form-group">
                <label>Alamat Lengkap *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows="3"
                  placeholder="Alamat lengkap lokasi wisata..."
                  required
                  maxLength="255"
                />
                <small>Maksimal 255 karakter</small>
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn primary"
                  disabled={loading}
                >
                  {loading ? "🔄 Menyimpan..." : "💾 Simpan Lokasi"}
                </button>
                <button
                  type="button"
                  onClick={handleFormCancel}
                  className="btn secondary"
                >
                  ❌ Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lokasi Breakdown dengan Data Real */}
      {locations.length > 0 && visitorsData.length > 0 && (
        <div className="locations-breakdown">
          <div className="section-header">
            <h3>📈 Statistik Pengunjung per Lokasi</h3>
            <span className="section-badge">Data Real-time dari Sistem</span>
          </div>
          <div className="locations-stats-grid">
            {locations.map((location) => {
              const stats = getLocationStats(location.location_code);

              return (
                <div
                  key={location.id}
                  className={`location-stat-item ${
                    !location.is_active ? "inactive" : ""
                  }`}
                >
                  <div className="location-stat-header">
                    <h4>{location.name}</h4>
                    <span className="location-code">
                      {location.location_code}
                    </span>
                  </div>
                  <div className="location-stat-numbers">
                    <div className="stat-number">
                      <span className="value">
                        {stats.totalVisitors.toLocaleString()}
                      </span>
                      <span className="label">Pengunjung</span>
                    </div>
                    <div className="stat-number">
                      <span className="value">
                        {stats.totalRecords.toLocaleString()}
                      </span>
                      <span className="label">Kunjungan</span>
                    </div>
                  </div>
                  <div className="location-stat-details">
                    <div className="stat-detail">
                      <span className="detail-label">👤 Individu:</span>
                      <span className="detail-value">
                        {stats.typeBreakdown.individual}
                      </span>
                    </div>
                    <div className="stat-detail">
                      <span className="detail-label">👥 Grup:</span>
                      <span className="detail-value">
                        {stats.typeBreakdown.group}
                      </span>
                    </div>
                    <div className="stat-detail">
                      <span className="detail-label">🇮🇩 Domestik:</span>
                      <span className="detail-value">
                        {stats.typeBreakdown.domestic}
                      </span>
                    </div>
                    <div className="stat-detail">
                      <span className="detail-label">🌍 Mancanegara:</span>
                      <span className="detail-value">
                        {stats.typeBreakdown.foreign}
                      </span>
                    </div>
                  </div>
                  <div className="location-stat-status">
                    {location.is_active ? (
                      <span className="status active">✅ Aktif</span>
                    ) : (
                      <span className="status inactive">⏸️ Nonaktif</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && locations.length === 0 ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Memuat data lokasi...</p>
        </div>
      ) : (
        <div className="locations-container">
          <div className="section-header">
            <h2>📋 Daftar Lokasi Wisata</h2>
            <span className="section-badge">{locations.length} lokasi</span>
          </div>

          <div className="locations-grid">
            {locations.map((location) => {
              const stats = getLocationStats(location.location_code);

              return (
                <div
                  key={location.id}
                  className={`location-card ${
                    !location.is_active ? "inactive" : ""
                  }`}
                >
                  <div className="card-header">
                    <div className="location-info">
                      <div className="location-title">
                        <h3>{location.name}</h3>
                        <span className="location-code">
                          {location.location_code}
                        </span>
                      </div>
                      <div className="location-meta">
                        <span className="visitor-count">
                          👥 {stats.totalVisitors.toLocaleString()} pengunjung
                        </span>
                        <span className="record-count">
                          📋 {stats.totalRecords} kunjungan
                        </span>
                      </div>
                    </div>
                    <div className="location-actions">
                      <button
                        className={`status-toggle ${
                          location.is_active ? "active" : "inactive"
                        }`}
                        onClick={() => toggleLocationStatus(location.id)}
                        title={location.is_active ? "Nonaktifkan" : "Aktifkan"}
                      >
                        {location.is_active ? "✅" : "⏸️"}
                      </button>
                      <button
                        className="btn-action delete"
                        onClick={() => deleteLocation(location.id)}
                        title="Hapus lokasi"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="card-body">
                    <p className="location-address">
                      <span className="icon">📍</span>
                      {location.address}
                    </p>
                    <div className="location-stats-preview">
                      <div className="stat-preview">
                        <span className="preview-icon">👤</span>
                        <span>{stats.typeBreakdown.individual} individu</span>
                      </div>
                      <div className="stat-preview">
                        <span className="preview-icon">👥</span>
                        <span>{stats.typeBreakdown.group} grup</span>
                      </div>
                      <div className="stat-preview">
                        <span className="preview-icon">🌍</span>
                        <span>{stats.typeBreakdown.foreign} mancanegara</span>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="card-footer">
                    <div className="qr-section">
                      <h4>🎯 Pilih Tipe Form Pengunjung:</h4>
                      <div className="qr-options">
                        {["individual", "group", "foreign"].map((formType) => (
                          <button
                            key={formType}
                            className={`qr-option ${
                              selectedFormType === formType &&
                              showQR === location.id
                                ? "active"
                                : ""
                            }`}
                            onClick={() => handleGenerateQR(location, formType)}
                          >
                            <span className="qr-icon">
                              {getFormTypeIcon(formType)}
                            </span>
                            <span className="qr-label">
                              {getFormTypeLabel(formType)}
                            </span>
                          </button>
                        ))}
                      </div>

                      {showQR === location.id && selectedFormType && (
                        <div className="qr-display">
                          <div className="qr-header">
                            <h5>
                              {getFormTypeIcon(selectedFormType)} QR Code -{" "}
                              {getFormTypeLabel(selectedFormType)}
                            </h5>
                            <button
                              className="close-qr"
                              onClick={() => setShowQR(null)}
                              title="Tutup QR Code"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="qr-content">
                            <div className="qr-code-container">
                              <QRCodeCanvas
                                id={`qrcode-${location.id}-${selectedFormType}`}
                                value={getQRValue(location, selectedFormType)}
                                size={180}
                                level="H"
                                includeMargin={true}
                                style={{ borderRadius: "12px" }}
                              />
                            </div>

                            <div className="qr-info">
                              <div className="qr-detail">
                                <strong>Lokasi:</strong> {location.name}
                              </div>
                              <div className="qr-detail">
                                <strong>Tipe Form:</strong>{" "}
                                {getFormTypeLabel(selectedFormType)}
                              </div>
                              <div className="qr-url">
                                <small>
                                  {getQRValue(location, selectedFormType)}
                                </small>
                              </div>
                            </div>
                          </div>

                          <div className="qr-actions">
                            <Link
                              to={`/visitor-form/${location.location_code}/${selectedFormType}`}
                              className="btn primary small"
                              target="_blank"
                            >
                              🔗 Buka Form
                            </Link>
                            <button
                              className="btn secondary small"
                              onClick={() =>
                                downloadQRCode(location, selectedFormType)
                              }
                            >
                              📥 Download QR
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {locations.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">🏛️</div>
          <h3>Belum ada lokasi yang terdaftar</h3>
          <p>Mulai dengan menambahkan lokasi wisata pertama Anda</p>
          <button
            className="btn primary large"
            onClick={() => setShowForm(true)}
          >
            ➕ Tambah Lokasi Pertama
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationManagement;