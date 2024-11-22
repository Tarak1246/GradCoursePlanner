import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavLink } from 'react-router-dom';


import Navbar from '../Navbar/Navbar';

const Layout = () => {
  return (
    <div className="layout">
      <Navbar />
      <main className="content">
        <Outlet /> {/* Renders the child routes dynamically */}
      </main>
    </div>
  );
};

export default Layout;
