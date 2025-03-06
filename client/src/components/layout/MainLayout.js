import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './MainLayout.css';

const MainLayout = ({ children }) => {
    return (
        <div className="layout">
            <Navbar />
            <div className="layout-content">
                <Sidebar />
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout; 