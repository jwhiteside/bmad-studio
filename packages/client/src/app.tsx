import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { NotificationProvider } from './layout/NotificationProvider.js'
import { AppShell } from './layout/AppShell.js'
import { OverviewPage } from './features/overview/OverviewPage.js'
import { AgentsPage } from './features/agents/AgentsPage.js'
import { AgentDetailPage } from './features/agents/AgentDetail.js'
import { AgentOverrideEditor } from './features/agents/AgentOverrideEditor.js'
import { TeamsPage } from './features/teams/TeamsPage.js'
import { SkillsPage } from './features/skills/SkillsPage.js'
import { WorkflowsPage } from './features/workflows/WorkflowsPage.js'
import { WorkflowDetailPage } from './features/workflows/WorkflowDetailPage.js'
import { OutputsPage } from './features/outputs/OutputsPage.js'
import { ConnectionsPage } from './features/connections/ConnectionsPage.js'
import { ProjectContextEditorPage } from './features/project-context/ProjectContextEditorPage.js'
import { ModulesPage } from './features/packages/PackagesPage.js'
import { FilesPage } from './features/files/FilesPage.js'
import { SettingsPage } from './features/settings/SettingsPage.js'
import { AboutPage } from './features/about/AboutPage.js'
import { CommandsPage } from './features/commands/CommandsPage.js'
import { ToolkitPage } from './features/toolkit/ToolkitPage.js'
import { WikiEditorPage } from './features/wiki/WikiEditorPage.js'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<OverviewPage />} />
              <Route path="agents" element={<AgentsPage />} />
              <Route path="agents/:id" element={<AgentDetailPage />} />
              <Route path="agents/:id/override" element={<AgentOverrideEditor />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route path="skills" element={<SkillsPage />} />
              <Route path="workflows" element={<WorkflowsPage />} />
              <Route path="workflows/:id" element={<WorkflowDetailPage />} />
              <Route path="outputs" element={<OutputsPage />} />
              <Route path="connections" element={<ConnectionsPage />} />
              <Route path="workspace" element={<Navigate to="/project-context" replace />} />
              <Route path="project-context" element={<ProjectContextEditorPage />} />
              <Route path="modules" element={<ModulesPage />} />
              <Route path="files" element={<FilesPage />} />
              <Route path="toolkit" element={<ToolkitPage />} />
              <Route path="commands" element={<CommandsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="wiki" element={<WikiEditorPage />} />
              <Route path="about" element={<AboutPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </QueryClientProvider>
  )
}
