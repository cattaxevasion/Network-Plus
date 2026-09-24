import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DayPage } from './pages/DayPage';
import { ExamFormPage } from './pages/ExamFormPage';
import { ExamsPage } from './pages/ExamsPage';
import { GlossaryPage } from './pages/GlossaryPage';
import { PlanPage } from './pages/PlanPage';
import { SettingsPage } from './pages/SettingsPage';
import { WeakAreasPage } from './pages/WeakAreasPage';
import { LoadErrorPage, LoadingPage, SignInPage } from './pages/GatePages';
import { SetupPage } from './pages/SetupPage';
import { StoreProvider, useStore } from './state/store';

// HashRouter: GitHub Pages has no SPA fallback, so /#/plan survives a page refresh.
export function App() {
  return (
    <StoreProvider>
      <Routed />
    </StoreProvider>
  );
}

function Routed() {
  const { mode } = useStore();
  if (mode === 'loading') return <LoadingPage />;
  if (mode === 'signin') return <SignInPage />;
  if (mode === 'error') return <LoadErrorPage />;
  if (mode === 'setup') return <SetupPage />;
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="plan" element={<PlanPage />} />
          <Route path="day/:day" element={<DayPage />} />
          <Route path="exams" element={<ExamsPage />} />
          <Route path="exams/new" element={<ExamFormPage key="new" />} />
          <Route path="exams/:id" element={<ExamFormPage />} />
          <Route path="weak" element={<WeakAreasPage />} />
          <Route path="glossary" element={<GlossaryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
