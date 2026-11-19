import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lightTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { MotionConfig } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from './config/wagmi';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { AuthorizePage } from './pages/AuthorizePage';
import { MyMandatesPage } from './pages/MyMandatesPage';
import { MandateDetailPage } from './pages/MandateDetailPage';
import { MerchantConsolePage } from './pages/MerchantConsolePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const rainbowTheme = lightTheme({
  accentColor: '#0F9D8F',
  accentColorForeground: '#FFFFFF',
  borderRadius: 'medium',
  fontStack: 'system',
});

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowTheme} modalSize="compact">
          <MotionConfig reducedMotion="user">
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/authorize" element={<AuthorizePage />} />
                  <Route path="/mandates" element={<MyMandatesPage />} />
                  <Route path="/mandates/:id" element={<MandateDetailPage />} />
                  <Route path="/merchant" element={<MerchantConsolePage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </MotionConfig>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
