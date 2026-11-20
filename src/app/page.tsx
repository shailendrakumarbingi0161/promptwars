'use client';

import React from 'react';
import { SimulationProvider, useSimulation } from '@/context/SimulationContext';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import OverviewView from '@/components/views/OverviewView';
import NetworkView from '@/components/views/NetworkView';
import SimulatorView from '@/components/views/SimulatorView';
import FlightsView from '@/components/views/FlightsView';
import DelayDNAView from '@/components/views/DelayDNAView';
import PassengersView from '@/components/views/PassengersView';
import CrewView from '@/components/views/CrewView';
import DispatcherDashboard from '@/components/views/DispatcherDashboard';
import RecoverySandboxView from '@/components/views/RecoverySandboxView';
import ComparisonView from '@/components/views/ComparisonView';
import DatasetView from '@/components/views/DatasetView';
import SettingsView from '@/components/views/SettingsView';

function MainAppContent() {
  const { activeTab } = useSimulation();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView />;
      case 'network':
        return <NetworkView />;
      case 'simulator':
        return <SimulatorView />;
      case 'flights':
        return <FlightsView />;
      case 'dna':
        return <DelayDNAView />;
      case 'passengers':
        return <PassengersView />;
      case 'crew':
        return <CrewView />;
      case 'dispatcher':
        return <DispatcherDashboard />;
      case 'recovery':
        return <RecoverySandboxView />;
      case 'comparison':
        return <ComparisonView />;
      case 'dataset':
        return <DatasetView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-aviation-darkest">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-[1700px] w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <SimulationProvider>
      <MainAppContent />
    </SimulationProvider>
  );
}
