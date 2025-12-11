import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './ChangePassword.css';

const ChangePassword = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
        setMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.newPassword !== formData.confirmPassword) {
            setError('Password baru dan konfirmasi password tidak cocok');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Password baru minimal 6 karakter');
            return;
        }

        setLoading(true);
        
        try {
            // Simulasi API call untuk ganti password
            const response = await fetch('http://localhost:5000/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setMessage('Password berhasil diubah!');
                setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                setError(data.error || 'Gagal mengubah password');
            }
        } catch (error) {
            setError('Terjadi kesalahan jaringan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="change-password">
            <h2>Ganti Password</h2>
            <form onSubmit={handleSubmit} className="password-form">
                {error && <div className="error-message">{error}</div>}
                {message && <div className="success-message">{message}</div>}
                
                <div className="form-group">
                    <label>Password Saat Ini:</label>
                    <input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                </div>
                
                <div className="form-group">
                    <label>Password Baru:</label>
                    <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        minLength="6"
                    />
                </div>
                
                <div className="form-group">
                    <label>Konfirmasi Password Baru:</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={loading}
                    />
                </div>
                
                <button type="submit" disabled={loading} className="submit-btn">
                    {loading ? 'Mengubah...' : 'Ganti Password'}
                </button>
            </form>
        </div>
    );
};

export default ChangePassword;