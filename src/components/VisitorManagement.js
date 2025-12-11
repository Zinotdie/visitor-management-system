import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './VisitorManagement.css';

const VisitorManagement = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    
    // KEY UNTUK LOCALSTORAGE
    const STORAGE_KEY = 'visitor_management_data';
    
    const [activeTab, setActiveTab] = useState('data');
    const [visitors, setVisitors] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingVisitor, setEditingVisitor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        location_code: '',
        visitor_name: '',
        male_count: 0,
        female_count: 0,
        visitor_type: 'domestic',
        notes: ''
    });
    const [filter, setFilter] = useState({
        location: '',
        dateFrom: '',
        dateTo: '',
        type: ''
    });

    // State untuk filter rekap bulanan
    const [monthlyFilter, setMonthlyFilter] = useState({
        year: new Date().getFullYear(),
        month: '' // Kosong berarti semua bulan
    });

    // ==================== LIFE CYCLE ====================
    useEffect(() => {
        loadDataFromStorage();
    }, []);

    useEffect(() => {
        if (visitors.length > 0) {
            saveDataToStorage();
        }
    }, [visitors]);

    // ==================== DATA MANAGEMENT ====================
    const loadDataFromStorage = () => {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            console.log('🔄 Loading data from storage...');
            
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                console.log('✅ Data loaded:', parsedData.length, 'items');
                
                // VALIDASI DATA: Pastikan semua field required ada
                const validData = parsedData.filter(item => 
                    item.id && 
                    item.location_code && 
                    item.visitor_name !== undefined &&
                    item.check_in_time
                );
                
                setVisitors(validData);
                console.log('✅ Valid data:', validData.length, 'items');
            } else {
                // HAPUS DATA DEMO - Mulai dengan array kosong
                console.log('📭 No data found, starting with empty database');
                setVisitors([]);
            }
        } catch (error) {
            console.error('❌ Error loading data:', error);
            setVisitors([]);
        }
    };

    const saveDataToStorage = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(visitors));
            console.log('💾 Data saved to storage:', visitors.length, 'items');
        } catch (error) {
            console.error('❌ Error saving data:', error);
        }
    };

    const refreshData = () => {
        console.log('🔄 Manual refresh...');
        loadDataFromStorage();
        setSuccess('Data berhasil di-refresh');
        setTimeout(() => setSuccess(''), 3000);
    };

    const clearAllData = () => {
        if (window.confirm('Apakah Anda yakin ingin menghapus SEMUA data? Tindakan ini tidak dapat dibatalkan!')) {
            localStorage.removeItem(STORAGE_KEY);
            setVisitors([]);
            setSuccess('Semua data berhasil dihapus');
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    // ==================== CRUD OPERATIONS ====================
    // CREATE - Tambah data baru
    const createVisitor = async (visitorData) => {
        try {
            setLoading(true);
            
            // Generate ID unik berdasarkan timestamp
            const newId = Date.now();
            
            const newVisitor = {
                id: newId,
                ...visitorData,
                location_name: getLocationName(visitorData.location_code),
                check_in_time: new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            // Tambah ke state
            setVisitors(prev => [newVisitor, ...prev]);
            
            console.log('✅ Visitor created:', newVisitor);
            return newVisitor;

        } catch (error) {
            console.error('Create visitor error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // READ - Get visitor by ID
    const getVisitorById = (id) => {
        return visitors.find(visitor => visitor.id === id);
    };

    // UPDATE - Edit data
    const updateVisitor = async (id, visitorData) => {
        try {
            setLoading(true);
            
            // Update state langsung
            setVisitors(prev => prev.map(visitor => 
                visitor.id === id 
                    ? { 
                        ...visitor, 
                        ...visitorData, 
                        location_name: getLocationName(visitorData.location_code),
                        updated_at: new Date().toISOString()
                    }
                    : visitor
            ));
            
            console.log('✏️ Visitor updated:', id);
            return { success: true };

        } catch (error) {
            console.error('Update visitor error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // DELETE - Hapus data
    const deleteVisitor = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus data pengunjung ini?')) {
            return;
        }

        try {
            setLoading(true);
            
            // Hapus dari state
            setVisitors(prev => {
                const updatedVisitors = prev.filter(visitor => visitor.id !== id);
                console.log(`🗑️ Deleted visitor ${id}, remaining:`, updatedVisitors.length);
                return updatedVisitors;
            });

            setSuccess('Data berhasil dihapus');
            setTimeout(() => setSuccess(''), 3000);
            
        } catch (error) {
            console.error('Delete visitor error:', error);
            setError('Gagal menghapus data pengunjung');
        } finally {
            setLoading(false);
        }
    };

    // ==================== FORM HANDLING ====================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            if (editingVisitor) {
                await updateVisitor(editingVisitor.id, formData);
                setSuccess('Data berhasil diupdate');
            } else {
                await createVisitor(formData);
                setSuccess('Data berhasil disimpan');
            }
            
            setShowForm(false);
            setEditingVisitor(null);
            resetForm();
            
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError(error.message || 'Terjadi kesalahan saat menyimpan data');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            location_code: '',
            visitor_name: '',
            male_count: 0,
            female_count: 0,
            visitor_type: 'domestic',
            notes: ''
        });
    };

    const handleEdit = (visitor) => {
        setEditingVisitor(visitor);
        setFormData({
            location_code: visitor.location_code,
            visitor_name: visitor.visitor_name || '',
            male_count: visitor.male_count || 0,
            female_count: visitor.female_count || 0,
            visitor_type: visitor.visitor_type || 'domestic',
            notes: visitor.notes || ''
        });
        setShowForm(true);
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setEditingVisitor(null);
        resetForm();
        setError('');
    };

    // ==================== UTILITIES ====================
    const getLocationName = (code) => {
        // HAPUS DATA DUMMY - Cek dari localStorage terlebih dahulu
        try {
            const savedLocations = localStorage.getItem('tourism_locations');
            if (savedLocations) {
                const parsedLocations = JSON.parse(savedLocations);
                const foundLocation = parsedLocations.find(loc => loc.location_code === code);
                if (foundLocation) {
                    return foundLocation.name;
                }
            }
        } catch (error) {
            console.error('Error loading location name:', error);
        }
        
        // Jika tidak ditemukan, return kode lokasi
        return code;
    };

    // Fungsi untuk mendapatkan daftar lokasi dari localStorage
    const getAvailableLocations = () => {
        try {
            const savedLocations = localStorage.getItem('tourism_locations');
            if (savedLocations) {
                const parsedLocations = JSON.parse(savedLocations);
                return parsedLocations.filter(loc => loc.is_active !== false);
            }
        } catch (error) {
            console.error('Error loading locations:', error);
        }
        return [];
    };

    const calculateTotalVisitors = (visitorsList) => {
        return visitorsList.reduce((total, visitor) => {
            return total + (visitor.male_count || 0) + (visitor.female_count || 0);
        }, 0);
    };

    // ==================== REKAP BULANAN ====================
    // Fungsi untuk mendapatkan tahun-tahun yang tersedia dari data
    const getAvailableYears = () => {
        const years = new Set();
        visitors.forEach(visitor => {
            const year = new Date(visitor.check_in_time).getFullYear();
            years.add(year);
        });
        
        // Tambahkan tahun saat ini jika belum ada
        const currentYear = new Date().getFullYear();
        years.add(currentYear);
        
        // Urutkan dari tahun terbesar ke terkecil
        return Array.from(years).sort((a, b) => b - a);
    };

    // Fungsi untuk mendapatkan bulan-bulan yang tersedia berdasarkan tahun yang dipilih
    const getAvailableMonths = (selectedYear) => {
        const months = new Set();
        visitors.forEach(visitor => {
            const date = new Date(visitor.check_in_time);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            
            if (year === selectedYear) {
                months.add(month);
            }
        });
        
        // Urutkan bulan
        return Array.from(months).sort((a, b) => a - b);
    };

    const getMonthlyReport = () => {
        const monthlyData = {};
        
        visitors.forEach(visitor => {
            const date = new Date(visitor.check_in_time);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const monthYear = `${year}-${month.toString().padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            
            // Filter berdasarkan tahun dan bulan yang dipilih
            if (monthlyFilter.year && year !== monthlyFilter.year) {
                return;
            }
            
            if (monthlyFilter.month && month !== parseInt(monthlyFilter.month)) {
                return;
            }
            
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = {
                    period: monthYear,
                    monthName: monthName,
                    year: year,
                    month: month,
                    totalRecords: 0,
                    totalVisitors: 0,
                    totalMale: 0,
                    totalFemale: 0,
                    locations: {},
                    types: {
                        domestic: 0,
                        international: 0
                    }
                };
            }
            
            const maleCount = visitor.male_count || 0;
            const femaleCount = visitor.female_count || 0;
            const totalCount = maleCount + femaleCount;
            const location = visitor.location_code;
            const type = visitor.visitor_type || 'domestic';
            
            // Update totals
            monthlyData[monthYear].totalRecords += 1;
            monthlyData[monthYear].totalVisitors += totalCount;
            monthlyData[monthYear].totalMale += maleCount;
            monthlyData[monthYear].totalFemale += femaleCount;
            
            // Update locations
            if (!monthlyData[monthYear].locations[location]) {
                monthlyData[monthYear].locations[location] = {
                    name: getLocationName(location),
                    total: 0,
                    records: 0
                };
            }
            monthlyData[monthYear].locations[location].total += totalCount;
            monthlyData[monthYear].locations[location].records += 1;
            
            // Update types
            monthlyData[monthYear].types[type] += totalCount;
        });
        
        // Convert to array and sort by period (newest first)
        return Object.values(monthlyData)
            .sort((a, b) => b.period.localeCompare(a.period));
    };

    // Fungsi untuk mendapatkan statistik total berdasarkan filter
    const getTotalStatistics = () => {
        const monthlyReport = getMonthlyReport();
        
        const totals = {
            totalRecords: 0,
            totalVisitors: 0,
            totalMale: 0,
            totalFemale: 0,
            totalDomestic: 0,
            totalInternational: 0
        };
        
        monthlyReport.forEach(month => {
            totals.totalRecords += month.totalRecords;
            totals.totalVisitors += month.totalVisitors;
            totals.totalMale += month.totalMale;
            totals.totalFemale += month.totalFemale;
            totals.totalDomestic += month.types.domestic;
            totals.totalInternational += month.types.international;
        });
        
        return totals;
    };

    // Reset filter bulanan
    const clearMonthlyFilter = () => {
        setMonthlyFilter({
            year: new Date().getFullYear(),
            month: ''
        });
    };

    // ==================== FILTER & SEARCH ====================
    const filteredVisitors = React.useMemo(() => {
        return visitors.filter(visitor => {
            const visitorDate = new Date(visitor.check_in_time);
            const matchesLocation = !filter.location || visitor.location_code === filter.location;
            const matchesDateFrom = !filter.dateFrom || visitorDate >= new Date(filter.dateFrom);
            const matchesDateTo = !filter.dateTo || visitorDate <= new Date(filter.dateTo + 'T23:59:59');
            const matchesType = !filter.type || visitor.visitor_type === filter.type;
            
            return matchesLocation && matchesDateFrom && matchesDateTo && matchesType;
        });
    }, [visitors, filter]);

    // Hitung statistik
    const totalVisitors = calculateTotalVisitors(filteredVisitors);
    const totalRecords = filteredVisitors.length;
    const individualCount = filteredVisitors.filter(v => 
        (v.male_count + v.female_count) === 1
    ).length;
    const groupCount = filteredVisitors.filter(v => 
        (v.male_count + v.female_count) > 1
    ).length;
    const foreignCount = filteredVisitors.filter(v => 
        v.visitor_type === 'international'
    ).length;

    // ==================== EXPORT ====================
    const exportToCSV = () => {
        if (filteredVisitors.length === 0) {
            alert('Tidak ada data untuk di-export');
            return;
        }

        const headers = [
            'Tanggal', 
            'Waktu', 
            'Kode Lokasi', 
            'Nama Lokasi',
            'Nama Pengunjung', 
            'Laki-laki', 
            'Perempuan', 
            'Total', 
            'Tipe', 
            'Catatan'
        ];
        
        const csvData = filteredVisitors.map(visitor => {
            const checkInTime = new Date(visitor.check_in_time);
            return [
                checkInTime.toLocaleDateString('id-ID'),
                checkInTime.toLocaleTimeString('id-ID'),
                visitor.location_code,
                getLocationName(visitor.location_code),
                visitor.visitor_name || '-',
                visitor.male_count || 0,
                visitor.female_count || 0,
                (visitor.male_count || 0) + (visitor.female_count || 0),
                visitor.visitor_type === 'international' ? 'Mancanegara' : 'Domestik',
                visitor.notes || '-'
            ];
        });

        const csvContent = [headers, ...csvData]
            .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `data-pengunjung-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const exportMonthlyReport = () => {
        const monthlyReport = getMonthlyReport();
        if (monthlyReport.length === 0) {
            alert('Tidak ada data rekap bulanan untuk di-export');
            return;
        }

        const headers = [
            'Bulan',
            'Total Records',
            'Total Pengunjung',
            'Laki-laki',
            'Perempuan',
            'Domestik',
            'Mancanegara'
        ];

        // Ambil semua lokasi yang ada
        const allLocations = new Set();
        monthlyReport.forEach(month => {
            Object.keys(month.locations).forEach(locationCode => {
                allLocations.add(locationCode);
            });
        });

        // Tambahkan header untuk setiap lokasi
        const locationHeaders = Array.from(allLocations).map(code => getLocationName(code));
        const allHeaders = [...headers, ...locationHeaders];
        
        const csvData = monthlyReport.map(month => {
            const baseData = [
                month.monthName,
                month.totalRecords,
                month.totalVisitors,
                month.totalMale,
                month.totalFemale,
                month.types.domestic,
                month.types.international
            ];

            // Tambahkan data untuk setiap lokasi
            const locationData = Array.from(allLocations).map(code => 
                month.locations[code]?.total || 0
            );

            return [...baseData, ...locationData];
        });

        const csvContent = [allHeaders, ...csvData]
            .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rekap-bulanan-pengunjung-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const clearFilters = () => {
        setFilter({
            location: '',
            dateFrom: '',
            dateTo: '',
            type: ''
        });
    };

    // ==================== NAVIGATION ====================
    const handleNavigation = (path) => {
        navigate(path);
    };

    // ==================== RENDER COMPONENTS ====================
    const renderMonthlyReportTab = () => {
        const monthlyReport = getMonthlyReport();
        const totalStats = getTotalStatistics();
        const availableYears = getAvailableYears();
        const availableMonths = getAvailableMonths(monthlyFilter.year);
        const availableLocations = getAvailableLocations();
        
        // Nama bulan dalam bahasa Indonesia
        const monthNames = {
            1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April',
            5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
            9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
        };
        
        return (
            <div className="monthly-report">
                <div className="section-header">
                    <h2>📊 Rekap Bulanan Pengunjung</h2>
                    <div className="header-actions">
                        <button 
                            onClick={exportMonthlyReport} 
                            className="btn secondary"
                            disabled={monthlyReport.length === 0}
                        >
                            📥 Export Rekap
                        </button>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="monthly-filter-controls">
                    <div className="filter-group">
                        <label>Tahun</label>
                        <select
                            value={monthlyFilter.year}
                            onChange={(e) => setMonthlyFilter({...monthlyFilter, year: parseInt(e.target.value), month: ''})}
                        >
                            {availableYears.map(year => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label>Bulan</label>
                        <select
                            value={monthlyFilter.month}
                            onChange={(e) => setMonthlyFilter({...monthlyFilter, month: e.target.value})}
                        >
                            <option value="">Semua Bulan</option>
                            {availableMonths.map(month => (
                                <option key={month} value={month}>
                                    {monthNames[month]}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <button 
                        onClick={clearMonthlyFilter}
                        className="btn outline"
                    >
                        🔄 Reset Filter
                    </button>
                </div>

                {/* Filter Info */}
                {(monthlyFilter.month || monthlyFilter.year !== new Date().getFullYear()) && (
                    <div className="filter-info">
                        <span>Filter aktif: </span>
                        {monthlyFilter.year && (
                            <span className="filter-tag">Tahun: {monthlyFilter.year}</span>
                        )}
                        {monthlyFilter.month && (
                            <span className="filter-tag">Bulan: {monthNames[parseInt(monthlyFilter.month)]}</span>
                        )}
                        <span className="filter-count">
                            ({monthlyReport.length} bulan ditemukan)
                        </span>
                    </div>
                )}

                {/* Total Statistics */}
                {monthlyReport.length > 0 && (
                    <div className="total-statistics">
                        <h3>📈 Statistik Total</h3>
                        <div className="stats-grid">
                            <div className="stat-card primary">
                                <div className="stat-icon">📋</div>
                                <div className="stat-info">
                                    <h3>Total Records</h3>
                                    <div className="stat-value">{totalStats.totalRecords}</div>
                                    <div className="stat-label">Data tercatat</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">👥</div>
                                <div className="stat-info">
                                    <h3>Total Pengunjung</h3>
                                    <div className="stat-value">{totalStats.totalVisitors}</div>
                                    <div className="stat-label">Orang</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">👨</div>
                                <div className="stat-info">
                                    <h3>Laki-laki</h3>
                                    <div className="stat-value">{totalStats.totalMale}</div>
                                    <div className="stat-label">Pengunjung</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">👩</div>
                                <div className="stat-info">
                                    <h3>Perempuan</h3>
                                    <div className="stat-value">{totalStats.totalFemale}</div>
                                    <div className="stat-label">Pengunjung</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Monthly Report Cards */}
                {monthlyReport.length > 0 ? (
                    <div className="monthly-grid">
                        {monthlyReport.map(month => (
                            <div key={month.period} className="monthly-card">
                                <div className="monthly-header">
                                    <h3>{month.monthName}</h3>
                                    <span className="total-badge">{month.totalRecords} records</span>
                                </div>
                                
                                <div className="monthly-stats">
                                    <div className="stat-row">
                                        <span className="stat-label">Total Pengunjung:</span>
                                        <span className="stat-value highlight">{month.totalVisitors}</span>
                                    </div>
                                    <div className="stat-row">
                                        <span className="stat-label">Laki-laki:</span>
                                        <span className="stat-value">{month.totalMale}</span>
                                    </div>
                                    <div className="stat-row">
                                        <span className="stat-label">Perempuan:</span>
                                        <span className="stat-value">{month.totalFemale}</span>
                                    </div>
                                </div>

                                <div className="monthly-breakdown">
                                    <div className="breakdown-section">
                                        <h4>📍 Per Lokasi</h4>
                                        {Object.entries(month.locations).map(([code, data]) => (
                                            <div key={code} className="breakdown-item">
                                                <span>{data.name}:</span>
                                                <span>{data.total} pengunjung ({data.records} records)</span>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="breakdown-section">
                                        <h4>🌍 Per Tipe</h4>
                                        <div className="breakdown-item">
                                            <span>Domestik:</span>
                                            <span>{month.types.domestic} pengunjung</span>
                                        </div>
                                        <div className="breakdown-item">
                                            <span>Mancanegara:</span>
                                            <span>{month.types.international} pengunjung</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">📊</div>
                        <p>
                            {visitors.length === 0 
                                ? 'Belum ada data untuk direkap' 
                                : 'Tidak ada data yang sesuai dengan filter'}
                        </p>
                        <p className="empty-subtitle">
                            {visitors.length === 0
                                ? 'Data rekap bulanan akan muncul setelah Anda menambahkan data pengunjung'
                                : 'Coba ubah filter tahun atau bulan yang dipilih'}
                        </p>
                        {visitors.length === 0 && (
                            <button 
                                className="btn primary"
                                onClick={() => setShowForm(true)}
                            >
                                + Tambah Data Pertama
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderDataTab = () => {
        const availableLocations = getAvailableLocations();
        
        return (
            <>
                <div className="page-actions">
                    <button onClick={() => setShowForm(true)} className="btn primary">
                        + Tambah Data Manual
                    </button>
                    <button onClick={exportToCSV} className="btn secondary" disabled={visitors.length === 0}>
                        📥 Export CSV
                    </button>
                    <button onClick={clearFilters} className="btn outline">
                        🗑️ Hapus Filter
                    </button>
                    <button onClick={clearAllData} className="btn danger" disabled={visitors.length === 0}>
                        🗑️ Hapus Semua Data
                    </button>
                    <button onClick={refreshData} className="btn outline">
                        🔄 Refresh Data
                    </button>
                </div>

                {/* Data Info */}
                <div className="data-info">
                    <span>💾 Database Real • </span>
                    <span>Total: {visitors.length} records • </span>
                    <span>
                        Sumber: {visitors.filter(v => v.source === 'qr_form').length} QR, 
                        {visitors.filter(v => !v.source).length} Manual
                    </span>
                </div>

                {/* Filter Section */}
                <div className="filter-section">
                    <h3>Filter Data</h3>
                    <div className="filter-grid">
                        <div className="form-group">
                            <label>Lokasi</label>
                            <select
                                value={filter.location}
                                onChange={(e) => setFilter({...filter, location: e.target.value})}
                            >
                                <option value="">Semua Lokasi</option>
                                {availableLocations.map(loc => (
                                    <option key={loc.location_code} value={loc.location_code}>
                                        {loc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tanggal Mulai</label>
                            <input
                                type="date"
                                value={filter.dateFrom}
                                onChange={(e) => setFilter({...filter, dateFrom: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Tanggal Akhir</label>
                            <input
                                type="date"
                                value={filter.dateTo}
                                onChange={(e) => setFilter({...filter, dateTo: e.target.value})}
                            />
                        </div>
                        <div className="form-group">
                            <label>Tipe Pengunjung</label>
                            <select
                                value={filter.type}
                                onChange={(e) => setFilter({...filter, type: e.target.value})}
                            >
                                <option value="">Semua Tipe</option>
                                <option value="domestic">Domestik</option>
                                <option value="international">Mancanegara</option>
                            </select>
                        </div>
                    </div>
                    
                    {(filter.location || filter.dateFrom || filter.dateTo || filter.type) && (
                        <div className="filter-info">
                            <span>Filter aktif: </span>
                            {filter.location && <span className="filter-tag">Lokasi: {getLocationName(filter.location)}</span>}
                            {filter.dateFrom && <span className="filter-tag">Dari: {filter.dateFrom}</span>}
                            {filter.dateTo && <span className="filter-tag">Sampai: {filter.dateTo}</span>}
                            {filter.type && <span className="filter-tag">Tipe: {filter.type === 'international' ? 'Mancanegara' : 'Domestik'}</span>}
                            <span className="filter-count">
                                ({filteredVisitors.length} data ditemukan)
                            </span>
                        </div>
                    )}
                </div>

                {/* Statistics */}
                <div className="visitor-stats">
                    <div className="stat-card primary">
                        <div className="stat-icon">👥</div>
                        <div className="stat-info">
                            <h3>Total Pengunjung</h3>
                            <div className="stat-value">{totalVisitors}</div>
                            <div className="stat-label">
                                {totalRecords} catatan
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">👤</div>
                        <div className="stat-info">
                            <h3>Individu</h3>
                            <div className="stat-value">{individualCount}</div>
                            <div className="stat-label">Pengunjung</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-info">
                            <h3>Grup</h3>
                            <div className="stat-value">{groupCount}</div>
                            <div className="stat-label">Rombongan</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🌍</div>
                        <div className="stat-info">
                            <h3>Mancanegara</h3>
                            <div className="stat-value">{foreignCount}</div>
                            <div className="stat-label">Pengunjung</div>
                        </div>
                    </div>
                </div>

                {/* Visitors Table */}
                <div className="visitors-table-container">
                    <div className="table-header">
                        <h3>Data Pengunjung ({visitors.length} total records)</h3>
                        <div className="table-summary">
                            Menampilkan {filteredVisitors.length} data
                        </div>
                    </div>
                    
                    {filteredVisitors.length > 0 ? (
                        <table className="visitors-table">
                            <thead>
                                <tr>
                                    <th>Tanggal/Waktu</th>
                                    <th>Lokasi</th>
                                    <th>Nama Pengunjung</th>
                                    <th>Laki-laki</th>
                                    <th>Perempuan</th>
                                    <th>Total</th>
                                    <th>Tipe</th>
                                    <th>Catatan</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVisitors.map(visitor => {
                                    const totalPerRecord = (visitor.male_count || 0) + (visitor.female_count || 0);
                                    const isIndividual = totalPerRecord === 1;
                                    const isForeign = visitor.visitor_type === 'international';
                                    
                                    return (
                                        <tr key={visitor.id}>
                                            <td>
                                                <div className="date-time">
                                                    <div className="date">{new Date(visitor.check_in_time).toLocaleDateString('id-ID')}</div>
                                                    <div className="time">{new Date(visitor.check_in_time).toLocaleTimeString('id-ID', { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="location-cell">
                                                    <strong>{getLocationName(visitor.location_code)}</strong>
                                                    <div className="location-code">({visitor.location_code})</div>
                                                </div>
                                            </td>
                                            <td>
                                                <strong>{visitor.visitor_name || 'Tidak ada nama'}</strong>
                                                {visitor.source === 'qr_form' && (
                                                    <div className="qr-badge">QR</div>
                                                )}
                                            </td>
                                            <td className="count-cell">
                                                <span className={`count ${visitor.male_count > 0 ? 'has-value' : ''}`}>
                                                    {visitor.male_count || 0}
                                                </span>
                                            </td>
                                            <td className="count-cell">
                                                <span className={`count ${visitor.female_count > 0 ? 'has-value' : ''}`}>
                                                    {visitor.female_count || 0}
                                                </span>
                                            </td>
                                            <td className="total-cell">
                                                <strong className="total-count">{totalPerRecord}</strong>
                                            </td>
                                            <td>
                                                <span className={`badge ${isForeign ? 'badge-foreign' : 'badge-domestic'} ${isIndividual ? 'badge-individual' : ''}`}>
                                                    {isForeign ? '🌍 Mancanegara' : isIndividual ? '👤 Individu' : '👥 Grup'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="notes-cell">
                                                    {visitor.notes || '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button 
                                                        className="btn-action edit"
                                                        title="Edit data"
                                                        onClick={() => handleEdit(visitor)}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button 
                                                        className="btn-action delete"
                                                        title="Hapus data"
                                                        onClick={() => deleteVisitor(visitor.id)}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <p>{visitors.length === 0 ? 'Database kosong' : 'Tidak ada data yang sesuai filter'}</p>
                            <p className="empty-subtitle">
                                {visitors.length === 0 
                                    ? 'Mulai dengan menambahkan data manual atau scan QR code' 
                                    : 'Coba ubah filter pencarian Anda'}
                            </p>
                            {visitors.length === 0 && (
                                <button 
                                    className="btn primary"
                                    onClick={() => setShowForm(true)}
                                >
                                    + Tambah Data Pertama
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </>
        );
    };

    // ==================== MAIN RENDER ====================
    const availableLocations = getAvailableLocations();

    return (
        <div className="visitor-management">
            <header className="page-header">
                <div className="header-content">
                    <button onClick={() => handleNavigation('/dashboard')} className="back-btn">
                        ← Kembali ke Dashboard
                    </button>
                    <div className="header-title">
                        <h1>Kelola Data Pengunjung</h1>
                        <p>Database Real • {visitors.length} records</p>
                    </div>
                </div>
            </header>

            {/* Messages */}
            {error && (
                <div className="error-message">
                    <span>⚠️ {error}</span>
                    <button onClick={() => setError('')} className="close-error">×</button>
                </div>
            )}
            
            {success && (
                <div className="success-message">
                    <span>✅ {success}</span>
                    <button onClick={() => setSuccess('')} className="close-error">×</button>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="tab-navigation">
                <button 
                    className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
                    onClick={() => setActiveTab('data')}
                >
                    📋 Data Pengunjung
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
                    onClick={() => setActiveTab('monthly')}
                >
                    📊 Rekap Bulanan
                </button>
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>{editingVisitor ? 'Edit Data Pengunjung' : 'Tambah Data Pengunjung'}</h2>
                            <button onClick={handleFormCancel} className="close-btn">×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Kode Lokasi *</label>
                                <select
                                    value={formData.location_code}
                                    onChange={(e) => setFormData({...formData, location_code: e.target.value})}
                                    required
                                >
                                    <option value="">Pilih Lokasi</option>
                                    {availableLocations.map(loc => (
                                        <option key={loc.location_code} value={loc.location_code}>
                                            {loc.location_code} - {loc.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Nama Pengunjung/Grup *</label>
                                <input
                                    type="text"
                                    value={formData.visitor_name}
                                    onChange={(e) => setFormData({...formData, visitor_name: e.target.value})}
                                    required
                                    placeholder="Masukkan nama pengunjung atau nama grup"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Jumlah Laki-laki</label>
                                    <input
                                        type="number"
                                        value={formData.male_count}
                                        onChange={(e) => setFormData({...formData, male_count: parseInt(e.target.value) || 0})}
                                        min="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Jumlah Perempuan</label>
                                    <input
                                        type="number"
                                        value={formData.female_count}
                                        onChange={(e) => setFormData({...formData, female_count: parseInt(e.target.value) || 0})}
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Tipe Pengunjung</label>
                                <select
                                    value={formData.visitor_type}
                                    onChange={(e) => setFormData({...formData, visitor_type: e.target.value})}
                                >
                                    <option value="domestic">Domestik</option>
                                    <option value="international">Mancanegara</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Catatan</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    rows="3"
                                    placeholder="Keterangan tambahan..."
                                />
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn primary" disabled={loading}>
                                    {loading ? 'Menyimpan...' : (editingVisitor ? 'Update Data' : 'Simpan Data')}
                                </button>
                                <button type="button" onClick={handleFormCancel} className="btn secondary">
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className={loading ? 'content-loading' : ''}>
                {activeTab === 'data' && renderDataTab()}
                {activeTab === 'monthly' && renderMonthlyReportTab()}
            </div>
        </div>
    );
};

export default VisitorManagement;