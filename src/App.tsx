/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppShell } from './components/AppShell';
import { RecallFlowProvider, useRecallFlow } from './context/RecallFlowContext';
import { ActionItemsPage } from './pages/ActionItemsPage';
import { AskMemoryPage } from './pages/AskMemoryPage';
import { CapturePage } from './pages/CapturePage';
import { DashboardPage } from './pages/DashboardPage';
import { MemoryExplorerPage } from './pages/MemoryExplorerPage';
import { SettingsPage } from './pages/SettingsPage';

const RouteView: React.FC = () => {
  const { currentRoute } = useRecallFlow();

  switch (currentRoute) {
    case '/capture':
      return <CapturePage />;
    case '/ask':
      return <AskMemoryPage />;
    case '/actions':
      return <ActionItemsPage />;
    case '/memories':
      return <MemoryExplorerPage />;
    case '/settings':
      return <SettingsPage />;
    case '/':
    default:
      return <DashboardPage />;
  }
};

export default function App() {
  return (
    <RecallFlowProvider>
      <AppShell>
        <RouteView />
      </AppShell>
    </RecallFlowProvider>
  );
}
