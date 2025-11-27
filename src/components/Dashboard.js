import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [yearlyStats, setYearlyStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // State untuk kalender
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyDetails, setDailyDetails] = useState([]);
  const [calendarView, setCalendarView] = useState("month"); // 'month' atau 'week'

  useEffect(() => {
    fetchDashboardData();
  }, [currentDate]); // Reload data ketika bulan/tahun berubah

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get visitor data from localStorage
      const STORAGE_KEY = 'visitor_management_data';
      const savedVisitors = localStorage.getItem(STORAGE_KEY);
      const visitors = savedVisitors ? JSON.parse(savedVisitors) : [];
      
      // Get locations data
      const savedLocations = localStorage.getItem('tourism_locations');
      const locations = savedLocations ? JSON.parse(savedLocations) : [];
      
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      // Calculate monthly visitors untuk bulan yang dipilih
      const monthlyVisitors = visitors.filter(visitor => {
        const visitDate = new Date(visitor.check_in_time);
        return visitDate.getFullYear() === currentYear && 
               visitDate.getMonth() === currentMonth;
      });

      // Calculate yearly visitors
      const yearlyVisitors = visitors.filter(visitor => {
        const visitDate = new Date(visitor.check_in_time);
        return visitDate.getFullYear() === currentYear;
      });

      // Generate monthly data for chart
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const monthVisitors = visitors.filter(visitor => {
          const visitDate = new Date(visitor.check_in_time);
          return visitDate.getFullYear() === currentYear && 
                 visitDate.getMonth() === i;
        });
        
        const totalVisitors = monthVisitors.reduce((sum, visitor) => 
          sum + (visitor.male_count || 0) + (visitor.female_count || 0), 0
        );

        return {
          month: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
                 "Jul", "Ags", "Sep", "Okt", "Nov", "Des"][i],
          visitors: totalVisitors,
          monthIndex: i
        };
      });

      // Generate daily data untuk kalender bulan berjalan
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dayVisitors = visitors.filter(visitor => {
          const visitDate = new Date(visitor.check_in_time);
          return visitDate.getFullYear() === currentYear && 
                 visitDate.getMonth() === currentMonth &&
                 visitDate.getDate() === day;
        });
        
        const totalVisitors = dayVisitors.reduce((sum, visitor) => 
          sum + (visitor.male_count || 0) + (visitor.female_count || 0), 0
        );

        const locationsBreakdown = {};
        const typesBreakdown = {
          domestic: 0,
          international: 0
        };

        dayVisitors.forEach(visitor => {
          // Breakdown per lokasi
          const location = visitor.location_code;
          if (!locationsBreakdown[location]) {
            locationsBreakdown[location] = 0;
          }
          locationsBreakdown[location] += (visitor.male_count || 0) + (visitor.female_count || 0);
          
          // Breakdown per tipe
          const type = visitor.visitor_type || 'domestic';
          typesBreakdown[type] += (visitor.male_count || 0) + (visitor.female_count || 0);
        });

        return {
          day: day,
          visitors: totalVisitors,
          records: dayVisitors.length,
          locationsBreakdown: locationsBreakdown,
          typesBreakdown: typesBreakdown,
          date: new Date(currentYear, currentMonth, day),
          visitorsList: dayVisitors
        };
      });

      const demoYearlyStats = {
        year: currentYear,
        total_visitors: yearlyVisitors.reduce((sum, visitor) => 
          sum + (visitor.male_count || 0) + (visitor.female_count || 0), 0
        ),
        total_locations: locations.length,
        monthly_data: monthlyData,
      };

      const demoMonthlyStats = {
        month: currentMonth + 1,
        year: currentYear,
        total_visitors: monthlyVisitors.reduce((sum, visitor) => 
          sum + (visitor.male_count || 0) + (visitor.female_count || 0), 0
        ),
        daily_data: dailyData,
      };

      const demoNotifications = [
        {
          id: 1,
          title: "Selamat Datang di Sistem DISBUDPORAPAR",
          message: "Sistem rekapitulasi pengunjung DISBUDPORAPAR Kota Banjarmasin",
          type: "info",
          date: new Date().toISOString(),
        },
        {
          id: 2,
          title: "Kalender Kunjungan Aktif",
          message: "Klik tanggal pada kalender untuk melihat detail pengunjung",
          type: "success",
          date: new Date().toISOString(),
        },
        {
          id: 3,
          title: `Statistik ${currentYear}`,
          message: `Total ${demoYearlyStats.total_visitors} pengunjung tercatat tahun ini`,
          type: "info",
          date: new Date().toISOString(),
        },
      ];

      setYearlyStats(demoYearlyStats);
      setMonthlyStats(demoMonthlyStats);
      setNotifications(demoNotifications);
      setDailyDetails(dailyData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // ==================== KALENDER FUNCTIONS ====================
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setSelectedDate(newDate);
  };

  const navigateToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleDateSelect = (day) => {
    if (day.currentMonth) {
      const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day.day);
      setSelectedDate(selected);
    }
  };

  const getSelectedDayDetails = () => {
    if (!selectedDate || !monthlyStats?.daily_data) return null;
    
    const selectedDay = selectedDate.getDate();
    return monthlyStats.daily_data.find(day => day.day === selectedDay);
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const calendar = [];
    let day = 1;

    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < startingDay) {
          const prevMonth = new Date(year, month, 0);
          const prevMonthDay = prevMonth.getDate() - startingDay + j + 1;
          week.push({ 
            day: prevMonthDay, 
            currentMonth: false,
            date: new Date(year, month - 1, prevMonthDay)
          });
        } else if (day > daysInMonth) {
          const nextMonthDay = day - daysInMonth;
          week.push({ 
            day: nextMonthDay, 
            currentMonth: false,
            date: new Date(year, month + 1, nextMonthDay)
          });
          day++;
        } else {
          const dayData = monthlyStats?.daily_data?.find(d => d.day === day);
          const today = new Date();
          week.push({
            day: day,
            currentMonth: true,
            date: new Date(year, month, day),
            hasVisitor: dayData?.visitors > 0,
            isToday: today.getDate() === day && today.getMonth() === month && today.getFullYear() === year,
            isSelected: selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year,
            visitorCount: dayData?.visitors || 0,
            recordsCount: dayData?.records || 0
          });
          day++;
        }
      }
      calendar.push(week);
    }

    return calendar;
  };

  const getLocationName = (code) => {
    const locations = {
      'GB': 'Gallery Bungas',
      'PIP': 'PIP',
      'RA': 'Rumah Anno'
    };
    return locations[code] || code;
  };

  // ==================== RENDER COMPONENTS ====================
  const renderCalendar = () => {
    const calendar = generateCalendar();
    const selectedDayDetails = getSelectedDayDetails();
    const today = new Date();

    return (
      <div className="calendar-section">
        <div className="section-header">
          <div className="section-title-group">
            <h3 className="section-title">📅 Kalender Kunjungan</h3>
            <span className="section-subtitle">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
          </div>
          <div className="calendar-controls">
            <button 
              className="calendar-nav-btn"
              onClick={() => navigateMonth('prev')}
              title="Bulan Sebelumnya"
            >
              ◀
            </button>
            <button 
              className="calendar-today-btn"
              onClick={navigateToToday}
            >
              Hari Ini
            </button>
            <button 
              className="calendar-nav-btn"
              onClick={() => navigateMonth('next')}
              title="Bulan Selanjutnya"
            >
              ▶
            </button>
          </div>
        </div>

        <div className="calendar-container">
          <div className="calendar-header">
            {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day) => (
              <div key={day} className="calendar-day-header">
                {day}
              </div>
            ))}
          </div>
          <div className="calendar-body">
            {calendar.map((week, weekIndex) => (
              <div key={weekIndex} className="calendar-week">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`calendar-day ${
                      day.currentMonth ? "current-month" : "other-month"
                    } ${day.hasVisitor ? "has-visitor" : ""} ${
                      day.isToday ? "today" : ""
                    } ${day.isSelected ? "selected" : ""}`}
                    onClick={() => handleDateSelect(day)}
                  >
                    <div className="day-header">
                      <span className="day-number">{day.day}</span>
                      {day.isToday && <div className="today-indicator">Hari Ini</div>}
                    </div>
                    
                    {day.currentMonth && (
                      <div className="day-content">
                        {day.hasVisitor ? (
                          <div className="visitor-info">
                            <div className="visitor-count-badge">
                              {day.visitorCount} 👥
                            </div>
                            <div className="records-count">
                              {day.recordsCount} data
                            </div>
                          </div>
                        ) : (
                          <div className="no-visitor">Tidak ada pengunjung</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedDayDetails && selectedDayDetails.visitors > 0 && (
          <div className="selected-day-details">
            <h4>📊 Detail Kunjungan {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h4>
            <div className="day-stats">
              <div className="day-stat">
                <span className="stat-label">Total Pengunjung</span>
                <span className="stat-value">{selectedDayDetails.visitors}</span>
              </div>
              <div className="day-stat">
                <span className="stat-label">Total Records</span>
                <span className="stat-value">{selectedDayDetails.records}</span>
              </div>
            </div>
            
            {Object.keys(selectedDayDetails.locationsBreakdown).length > 0 && (
              <div className="location-breakdown">
                <h5>📍 Per Lokasi</h5>
                <div className="breakdown-list">
                  {Object.entries(selectedDayDetails.locationsBreakdown).map(([location, count]) => (
                    <div key={location} className="breakdown-item">
                      <span>{getLocationName(location)}</span>
                      <span>{count} pengunjung</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="type-breakdown">
              <h5>🌍 Per Tipe Pengunjung</h5>
              <div className="breakdown-list">
                <div className="breakdown-item">
                  <span>Domestik</span>
                  <span>{selectedDayDetails.typesBreakdown.domestic} pengunjung</span>
                </div>
                <div className="breakdown-item">
                  <span>Mancanegara</span>
                  <span>{selectedDayDetails.typesBreakdown.international} pengunjung</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedDayDetails && selectedDayDetails.visitors === 0 && (
          <div className="selected-day-details empty">
            <h4>📅 {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h4>
            <p>Tidak ada kunjungan tercatat pada hari ini</p>
          </div>
        )}

        <div className="calendar-legend">
          <div className="legend-item">
            <div className="legend-color today"></div>
            <span>Hari Ini</span>
          </div>
          <div className="legend-item">
            <div className="legend-color visitor"></div>
            <span>Ada Pengunjung</span>
          </div>
          <div className="legend-item">
            <div className="legend-color selected"></div>
            <span>Tanggal Dipilih</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Memuat dashboard...</p>
      </div>
    );
  }

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  return (
    <div className="dashboard-disbudporapar">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-brand">
            <div className="logo-container">
              <img 
                src="/images/logo.png" 
                alt="DISBUDPORAPAR Logo" 
                className="logo-image"
              />
            </div>
            <div className="brand-text">
              <h1 className="dashboard-title">DISBUDPORAPAR</h1>
              <p className="dashboard-subtitle">Kota Banjarmasin</p>
            </div>
          </div>
          <div className="header-actions">
            <div className="user-info">
              <div className="user-avatar">
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-name">{user?.full_name}</span>
                <span className="user-role">Administrator</span>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-container">
          <button
            className={`nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </button>
          <button
            className="nav-btn"
            onClick={() => navigate("/visitors")}
          >
            <span className="nav-icon">👥</span>
            Data Pengunjung
          </button>
          <button
            className="nav-btn"
            onClick={() => navigate("/locations")}
          >
            <span className="nav-icon">🏛️</span>
            Kelola Lokasi
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-content">
            <div className="welcome-text">
              <h2 className="welcome-title">
                {getGreeting()}, {user?.full_name}!
              </h2>
              <p className="welcome-subtitle">
                Selamat datang di Sistem Rekapitulasi Pengunjung DISBUDPORAPAR Kota Banjarmasin
              </p>
            </div>
            <div className="welcome-meta">
              <div className="current-date">
                {new Date().toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="welcome-stats">
                <span className="stat-item">
                  <strong>{yearlyStats?.total_visitors || 0}</strong> Pengunjung Tahun Ini
                </span>
                <span className="stat-item">
                  <strong>{yearlyStats?.total_locations || 0}</strong> Lokasi Wisata
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-card-content">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>Total Pengunjung</h3>
                <div className="stat-value">{yearlyStats?.total_visitors || 0}</div>
                <div className="stat-label">Tahun {currentDate.getFullYear()}</div>
              </div>
            </div>
            <div className="stat-trend positive">
              <span>📈 Tren Naik</span>
            </div>
          </div>

          <div className="stat-card secondary">
            <div className="stat-card-content">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>Bulan Ini</h3>
                <div className="stat-value">{monthlyStats?.total_visitors || 0}</div>
                <div className="stat-label">{monthNames[currentDate.getMonth()]}</div>
              </div>
            </div>
            <div className="stat-trend">
              <span>🔄 Update Harian</span>
            </div>
          </div>

          <div className="stat-card tertiary">
            <div className="stat-card-content">
              <div className="stat-icon">🏛️</div>
              <div className="stat-info">
                <h3>Lokasi Wisata</h3>
                <div className="stat-value">{yearlyStats?.total_locations || 0}</div>
                <div className="stat-label">Aktif</div>
              </div>
            </div>
            <div className="stat-trend">
              <span>✅ Semua Berjalan</span>
            </div>
          </div>

          <div className="stat-card accent">
            <div className="stat-card-content">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>Rata-rata Harian</h3>
                <div className="stat-value">
                  {Math.round((monthlyStats?.total_visitors || 0) / Math.max(1, new Date().getDate()))}
                </div>
                <div className="stat-label">Pengunjung/hari</div>
              </div>
            </div>
            <div className="stat-trend">
              <span>🎯 Target Tercapai</span>
            </div>
          </div>
        </div>

        <div className="dashboard-main-content">
          {/* Left Column */}
          <div className="content-left">
            {renderCalendar()}

            {/* Monthly Chart Section */}
            <div className="chart-section">
              <div className="section-header">
                <h3 className="section-title">📈 Statistik Tahunan {currentDate.getFullYear()}</h3>
              </div>
              <div className="chart-container">
                <div className="chart-bars">
                  {yearlyStats?.monthly_data?.map((monthData, index) => (
                    <div key={index} className="chart-bar-container">
                      <div className="chart-bar-wrapper">
                        <div 
                          className={`chart-bar ${monthData.visitors > 0 ? 'active' : ''} ${
                            index === currentDate.getMonth() ? 'current-month' : ''
                          }`}
                          style={{ 
                            height: `${Math.max(10, (monthData.visitors / Math.max(1, yearlyStats.total_visitors)) * 100)}%` 
                          }}
                        >
                          <div className="bar-value">{monthData.visitors}</div>
                        </div>
                      </div>
                      <div className="chart-label">{monthData.month}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="content-right">
            {/* Notifications */}
            <div className="notifications-section">
              <div className="section-header">
                <h3 className="section-title">🔔 Notifikasi Terbaru</h3>
                <span className="notification-badge">{notifications.length}</span>
              </div>
              <div className="notifications-list">
                {notifications.map((notification) => (
                  <div key={notification.id} className={`notification-item ${notification.type}`}>
                    <div className="notification-icon">
                      {notification.type === 'success' ? '✅' : 'ℹ️'}
                    </div>
                    <div className="notification-content">
                      <h4 className="notification-title">{notification.title}</h4>
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">
                        {new Date(notification.date).toLocaleDateString('id-ID')} • {new Date(notification.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
              <div className="section-header">
                <h3 className="section-title">⚡ Aksi Cepat</h3>
              </div>
              <div className="quick-actions-grid">
                <button 
                  className="quick-action-btn primary"
                  onClick={() => navigate("/visitors")}
                >
                  <span className="action-icon">👥</span>
                  <span className="action-text">Data Pengunjung</span>
                  <span className="action-arrow">→</span>
                </button>
                <button 
                  className="quick-action-btn secondary"
                  onClick={() => navigate("/locations")}
                >
                  <span className="action-icon">🏛️</span>
                  <span className="action-text">Kelola Lokasi</span>
                  <span className="action-arrow">→</span>
                </button>
                <button className="quick-action-btn accent">
                  <span className="action-icon">📊</span>
                  <span className="action-text">Buat Laporan</span>
                  <span className="action-arrow">→</span>
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="system-status-section">
              <div className="section-header">
                <h3 className="section-title">🟢 Status Sistem</h3>
              </div>
              <div className="status-list">
                <div className="status-item online">
                  <div className="status-indicator"></div>
                  <span className="status-text">Database</span>
                  <span className="status-value">Online</span>
                </div>
                <div className="status-item online">
                  <div className="status-indicator"></div>
                  <span className="status-text">Kalender</span>
                  <span className="status-value">Aktif</span>
                </div>
                <div className="status-item online">
                  <div className="status-indicator"></div>
                  <span className="status-text">Statistik</span>
                  <span className="status-value">Real-time</span>
                </div>
                <div className="status-item online">
                  <div className="status-indicator"></div>
                  <span className="status-text">Backup</span>
                  <span className="status-value">Aktif</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <div className="footer-info">
            <div className="footer-logo">🏛️</div>
            <div className="footer-text">
              <strong>DISBUDPORAPAR Kota Banjarmasin</strong>
              <span>Sistem Rekapitulasi Pengunjung Wisata</span>
            </div>
          </div>
          <div className="footer-meta">
            <span className="footer-user">{user?.full_name} • Administrator</span>
            <span className="footer-version">v2.1.0</span>
            <span className="footer-update">Terakhir update: {new Date().toLocaleTimeString('id-ID')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;