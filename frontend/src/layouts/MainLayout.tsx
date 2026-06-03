import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
// Removing Footer from main layout, usually dashboards don't have a footer or it's very minimal at the bottom of the content area.

export function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar (Fixed left, w-64 is 16rem = 256px) */}
      <Sidebar />

      {/* Main Content Area (ml-64 because sidebar is fixed) */}
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <Header />
        
        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
