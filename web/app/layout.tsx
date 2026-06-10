import '../styles/globals.css';
import AuthProvider from '../components/AuthProvider';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Demo Store',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-100">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthProvider>
          <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.15),_transparent_18%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.18),_transparent_14%),linear-gradient(180deg,_#050505_0%,_#1f1306_35%,_#0f0702_100%)]">
            <Navbar />
            <main id="main-content" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
              {children}
            </main>
            <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
              Demo e-commerce app
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
