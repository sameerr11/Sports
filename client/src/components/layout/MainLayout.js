import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import './MainLayout.css';

const MainLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="layout">
            <Navbar toggleSidebar={toggleSidebar} />
            <div className={`layout-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                <Sidebar open={sidebarOpen} toggleSidebar={toggleSidebar} />
                <main className="main-content">
                    {children}
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default MainLayout; 