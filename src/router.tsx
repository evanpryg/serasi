import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet, ScrollRestoration } from 'react-router'
import { GuestOnly, OnboardingGate, RequireAuth, RequireWorkspace } from '@/auth/guards'
import { FullPageSpinner, Spinner } from '@/components/ui/Feedback'
import { SoundToggle } from '@/components/sound/SoundToggle'
import { PublicLayout } from '@/pages/public/PublicLayout'
import { LandingPage } from '@/pages/public/LandingPage'

// Landing dimuat langsung; halaman lain dipecah per chunk agar ringan di koneksi seluler.
const named = <K extends string>(loader: () => Promise<Record<K, React.ComponentType<any>>>, name: K) =>
  lazy(() => loader().then((m) => ({ default: m[name] })))

const info = () => import('@/pages/public/InfoPages')
const NotFoundPage = named(info, 'NotFoundPage')
const PrivacyPage = named(info, 'PrivacyPage')
const TermsPage = named(info, 'TermsPage')
const VendorDirectoryPage = named(info, 'VendorDirectoryPage')
const LoginPage = named(() => import('@/pages/auth/LoginPage'), 'LoginPage')
const RegisterPage = named(() => import('@/pages/auth/RegisterPage'), 'RegisterPage')
const ForgotPasswordPage = named(() => import('@/pages/auth/ForgotPasswordPage'), 'ForgotPasswordPage')
const ResetPasswordPage = named(() => import('@/pages/auth/ResetPasswordPage'), 'ResetPasswordPage')
const AuthCallbackPage = named(() => import('@/pages/auth/AuthCallbackPage'), 'AuthCallbackPage')
const OnboardingPage = named(() => import('@/pages/OnboardingPage'), 'OnboardingPage')
const AppLayout = named(() => import('@/components/layout/AppLayout'), 'AppLayout')
const DashboardPage = named(() => import('@/pages/app/DashboardPage'), 'DashboardPage')
const SettingsPage = named(() => import('@/pages/app/SettingsPage'), 'SettingsPage')
const JoinPage = named(() => import('@/pages/JoinPage'), 'JoinPage')
const KitaPage = named(() => import('@/pages/app/kita/KitaPage'), 'KitaPage')
const PersonalityPage = named(() => import('@/pages/app/kita/PersonalityPage'), 'PersonalityPage')
const DeepTalkPage = named(() => import('@/pages/app/kita/DeepTalkPage'), 'DeepTalkPage')
const BudgetPage = named(() => import('@/pages/app/BudgetPage'), 'BudgetPage')
const VendorsPage = named(() => import('@/pages/app/VendorsPage'), 'VendorsPage')
const ChecklistPage = named(() => import('@/pages/app/ChecklistPage'), 'ChecklistPage')
const GuestsPage = named(() => import('@/pages/app/GuestsPage'), 'GuestsPage')
const RundownPage = named(() => import('@/pages/app/RundownPage'), 'RundownPage')

function Root() {
  return (
    <>
      <ScrollRestoration />
      <Suspense fallback={<FullPageSpinner />}>
        <Outlet />
      </Suspense>
      <SoundToggle />
    </>
  )
}


export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/', element: <LandingPage /> },
          { path: '/vendors', element: <VendorDirectoryPage /> },
          { path: '/privasi', element: <PrivacyPage /> },
          { path: '/syarat', element: <TermsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ].map((r) => ({ ...r, element: <Suspense fallback={<Spinner className="py-24" />}>{r.element}</Suspense> })),
      },
      {
        element: <GuestOnly />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
        ],
      },
      { path: '/auth/callback', element: <AuthCallbackPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/join/:code', element: <JoinPage /> },
      {
        element: <RequireAuth />,
        children: [
          {
            path: '/onboarding',
            element: (
              <OnboardingGate>
                <OnboardingPage />
              </OnboardingGate>
            ),
          },
          {
            path: '/app',
            element: <RequireWorkspace />,
            children: [
              {
                element: <AppLayout />,
                children: [
                  { index: true, element: <Navigate to="/app/dashboard" replace /> },
                  { path: 'dashboard', element: <DashboardPage /> },
                  { path: 'budget', element: <BudgetPage /> },
                  { path: 'vendors', element: <VendorsPage /> },
                  { path: 'checklist', element: <ChecklistPage /> },
                  { path: 'guests', element: <GuestsPage /> },
                  { path: 'rundown', element: <RundownPage /> },
                  { path: 'kita', element: <KitaPage /> },
                  { path: 'kita/kepribadian', element: <PersonalityPage /> },
                  { path: 'kita/deeptalk', element: <DeepTalkPage /> },
                  { path: 'settings', element: <SettingsPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
])
