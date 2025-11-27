import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './VisitorForm.css';

const VisitorForm = () => {
    const { locationCode, formType } = useParams();
    const navigate = useNavigate();
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        visitor_name: '',
        total_visitors: 1,
        male_count: 0,
        female_count: 0,
        gender: 'male' // untuk form individu
    });

    // KEY untuk localStorage (harus sama dengan VisitorManagement)
    const STORAGE_KEY = 'visitor_management_data';

    useEffect(() => {
        fetchLocationInfo();
        // Set default values berdasarkan form type
        if (formType === 'individual') {
            setFormData(prev => ({
                ...prev,
                male_count: 1,
                female_count: 0,
                gender: 'male'
            }));
        }
    }, [locationCode, formType]);

    const fetchLocationInfo = async () => {
        const locations = {
            'GB': { name: 'Gallery Bungas', address: 'Jl. Gallery Bungas No. 123' },
            'PIP': { name: 'PIP', address: 'Jl. PIP No. 456' },
            'RA': { name: 'Rumah Anno', address: 'Jl. Rumah Anno No. 789' }
        };
        setLocation(locations[locationCode] || { name: 'Lokasi Tidak Ditemukan', address: '' });
    };

    const getLocationName = (code) => {
        const locations = {
            'GB': 'Gallery Bungas',
            'PIP': 'PIP',
            'RA': 'Rumah Anno'
        };
        return locations[code] || code;
    };

    // Handle perubahan gender untuk form individu
    const handleGenderChange = (gender) => {
        setFormData(prev => ({
            ...prev,
            gender: gender,
            male_count: gender === 'male' ? 1 : 0,
            female_count: gender === 'female' ? 1 : 0,
            total_visitors: 1
        }));
    };

    // Handle perubahan jumlah untuk form grup
    const handleGroupCountChange = (type, value) => {
        const numValue = parseInt(value) || 0;
        setFormData(prev => ({
            ...prev,
            [type]: numValue,
            total_visitors: (type === 'male_count' ? numValue : prev.male_count) + 
                           (type === 'female_count' ? numValue : prev.female_count)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Validasi form
            if (formType === 'group' && (formData.male_count + formData.female_count) === 0) {
                alert('❌ Jumlah pengunjung tidak boleh 0');
                setLoading(false);
                return;
            }

            if (formType === 'individual' && formData.visitor_name.trim() === '') {
                alert('❌ Nama pengunjung harus diisi');
                setLoading(false);
                return;
            }

            // Siapkan data untuk disimpan
            const submitData = {
                id: Date.now(), // ID unik berdasarkan timestamp
                location_code: locationCode,
                location_name: getLocationName(locationCode),
                visitor_name: formData.visitor_name.trim() || 
                            (formType === 'individual' ? 
                             `Pengunjung ${formData.gender === 'male' ? 'Laki-laki' : 'Perempuan'}` : 
                             'Rombongan'),
                male_count: formData.male_count,
                female_count: formData.female_count,
                visitor_type: formType === 'foreign' ? 'international' : 'domestic',
                check_in_time: new Date().toISOString(),
                notes: formType === 'individual' ? 
                       `Pengunjung individu (${formData.gender === 'male' ? 'Laki-laki' : 'Perempuan'})` :
                       formType === 'group' ? `Rombongan: ${formData.total_visitors} orang` :
                       'Wisatawan mancanegara',
                created_by: 'qr_system',
                source: 'qr_form', // Tanda bahwa data berasal dari QR form
                created_at: new Date().toISOString()
            };

            // Simpan ke localStorage (sinkron dengan VisitorManagement)
            await saveToLocalStorage(submitData);
            
            alert('✅ Data berhasil disimpan!');
            navigate('/thank-you');
            
        } catch (error) {
            console.error('Error saving data:', error);
            alert('❌ Terjadi kesalahan saat menyimpan data.');
        } finally {
            setLoading(false);
        }
    };

    const saveToLocalStorage = (visitorData) => {
        try {
            // Ambil data yang sudah ada dari localStorage
            const existingData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            
            // Validasi: cek apakah data dengan ID yang sama sudah ada
            const isDuplicate = existingData.some(item => item.id === visitorData.id);
            if (isDuplicate) {
                // Generate new ID jika duplicate
                visitorData.id = Date.now() + Math.floor(Math.random() * 1000);
            }
            
            // Tambahkan data baru di awal array
            const updatedData = [visitorData, ...existingData];
            
            // Simpan kembali ke localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
            
            console.log('✅ Data saved to localStorage:', visitorData);
            console.log('📊 Total records in storage:', updatedData.length);
            
        } catch (error) {
            console.error('❌ Error saving to localStorage:', error);
            throw error;
        }
    };

    const getFormTitle = () => {
        switch (formType) {
            case 'individual': return 'Form Individu';
            case 'group': return 'Form Grup';
            case 'foreign': return 'Form Mancanegara';
            default: return 'Form Pengunjung';
        }
    };

    const getFormDescription = () => {
        switch (formType) {
            case 'individual': return 'Isi data untuk pengunjung perorangan';
            case 'group': return 'Isi data untuk rombongan pengunjung';
            case 'foreign': return 'Isi data untuk wisatawan mancanegara';
            default: return 'Isi data pengunjung';
        }
    };

    if (!location) {
        return <div className="loading">Memuat form...</div>;
    }

    return (
        <div className="visitor-form-page">
            <div className="form-container simple-form">
                <div className="form-header">
                    <h1>{getFormTitle()}</h1>
                    <div className="location-info">
                        <h2>{location.name}</h2>
                        <p>{getFormDescription()}</p>
                        <p className="location-address">{location.address}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="visitor-form">
                    <div className="form-section">
                        <div className="form-group">
                            <label>Nama {formType === 'group' ? 'Grup/Penanggung Jawab' : 'Pengunjung'} *</label>
                            <input
                                type="text"
                                value={formData.visitor_name}
                                onChange={(e) => setFormData({...formData, visitor_name: e.target.value})}
                                placeholder={formType === 'group' ? "Nama grup atau penanggung jawab" : "Nama pengunjung"}
                                required
                            />
                        </div>

                        {/* FORM UNTUK INDIVIDU */}
                        {formType === 'individual' && (
                            <div className="form-group">
                                <label>Jenis Kelamin *</label>
                                <div className="gender-selection">
                                    <label className="gender-option">
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="male"
                                            checked={formData.gender === 'male'}
                                            onChange={() => handleGenderChange('male')}
                                        />
                                        <span className="gender-label">Laki-laki</span>
                                    </label>
                                    <label className="gender-option">
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="female"
                                            checked={formData.gender === 'female'}
                                            onChange={() => handleGenderChange('female')}
                                        />
                                        <span className="gender-label">Perempuan</span>
                                    </label>
                                </div>
                                <div className="gender-summary">
                                    <small>
                                        {formData.gender === 'male' ? '👦 Laki-laki' : '👧 Perempuan'} - 1 orang
                                    </small>
                                </div>
                            </div>
                        )}

                        {/* FORM UNTUK GRUP */}
                        {formType === 'group' && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Jumlah Laki-laki</label>
                                    <input
                                        type="number"
                                        value={formData.male_count}
                                        onChange={(e) => handleGroupCountChange('male_count', e.target.value)}
                                        min="0"
                                        max="100"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Jumlah Perempuan</label>
                                    <input
                                        type="number"
                                        value={formData.female_count}
                                        onChange={(e) => handleGroupCountChange('female_count', e.target.value)}
                                        min="0"
                                        max="100"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        )}

                        {/* FORM UNTUK WISATAWAN ASING */}
                        {formType === 'foreign' && (
                            <div className="form-group">
                                <label>Jumlah Pengunjung</label>
                                <input
                                    type="number"
                                    value={formData.total_visitors}
                                    onChange={(e) => setFormData({...formData, total_visitors: parseInt(e.target.value) || 1})}
                                    min="1"
                                    max="100"
                                    required
                                />
                                <small className="form-hint">
                                    Total: {formData.total_visitors} orang
                                </small>
                            </div>
                        )}

                        {/* SUMMARY */}
                        {(formType === 'group' || formType === 'foreign') && (
                            <div className="summary-section">
                                <div className="summary-card">
                                    <h4>Ringkasan</h4>
                                    <div className="summary-details">
                                        <div className="summary-item">
                                            <span>Laki-laki:</span>
                                            <strong>{formData.male_count}</strong>
                                        </div>
                                        <div className="summary-item">
                                            <span>Perempuan:</span>
                                            <strong>{formData.female_count}</strong>
                                        </div>
                                        <div className="summary-total">
                                            <span>Total Pengunjung:</span>
                                            <strong>{formData.total_visitors} orang</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn primary" disabled={loading}>
                            {loading ? 'Menyimpan...' : '💾 Simpan Data'}
                        </button>
                        <button type="button" className="btn secondary" onClick={() => window.history.back()}>
                            Kembali
                        </button>
                    </div>

                    <div className="form-footer">
                        <p>Data akan tersimpan di sistem pengunjung dan dapat dilihat di halaman management</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VisitorForm;