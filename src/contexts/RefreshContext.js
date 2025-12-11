// contexts/RefreshContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';

const RefreshContext = createContext();

export const useRefresh = () => {
    const context = useContext(RefreshContext);
    if (!context) {
        throw new Error('useRefresh must be used within a RefreshProvider');
    }
    return context;
};

export const RefreshProvider = ({ children }) => {
    const [refreshTriggers, setRefreshTriggers] = useState({
        dashboard: 0,
        locations: 0,
        visitors: 0
    });

    const triggerRefresh = useCallback((component = 'dashboard') => {
        console.log(`🔁 Triggering refresh for: ${component}`);
        setRefreshTriggers(prev => ({
            ...prev,
            [component]: prev[component] + 1
        }));
    }, []);

    const value = {
        refreshTriggers,
        triggerRefresh
    };

    return (
        <RefreshContext.Provider value={value}>
            {children}
        </RefreshContext.Provider>
    );
};