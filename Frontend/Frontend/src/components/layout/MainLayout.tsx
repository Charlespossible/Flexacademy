import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

/**
 * MainLayout: Wraps authenticated app pages with Navbar and Footer
 * Used for dashboard, study, and other authenticated user pages
 */
export function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {/*
        The Navbar is `position: fixed`, so it is out of normal flow and does
        NOT push content down. Without this offset every page's top 64px sits
        underneath it — decorative whitespace goes unnoticed, but anything
        interactive up there silently swallows clicks.
        pt-16 matches the navbar's h-16 row.
      */}
      <main className="flex-grow pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
