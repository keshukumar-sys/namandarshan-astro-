import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Menu, X, User, CreditCard, LogOut, ChevronDown } from "lucide-react";
import namanLogo from "@/assets/naman.webp";
import { useAuth } from "@/context/AuthContext";

import TopBar from "./TopBar";
import GlobalSearch from "@/components/common/GlobalSearch";

const Header = () => {
  const { isUserAuthenticated, isLoading, logoutUser, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAstroDropdownOpen, setIsAstroDropdownOpen] = useState(false);
  const [isAccommodationDropdownOpen, setIsAccommodationDropdownOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < window.innerHeight);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty("--header-height", `${height}px`);
      }
    };

    updateHeaderHeight();

    // Create a ResizeObserver to observe changes in header size dynamically
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && headerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateHeaderHeight();
      });
      resizeObserver.observe(headerRef.current);
    } else {
      window.addEventListener("resize", updateHeaderHeight);
    }

    // Schedule updates to cover safe area, font, or image rendering delays
    const timers = [
      setTimeout(updateHeaderHeight, 50),
      setTimeout(updateHeaderHeight, 150),
      setTimeout(updateHeaderHeight, 300),
      setTimeout(updateHeaderHeight, 600)
    ];

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", updateHeaderHeight);
      }
      timers.forEach(clearTimeout);
    };
  }, [isSearchOpen, isMenuOpen]);

  const navLinks = [
    { name: "Temples", href: "/temples" },
    { name: "Darshan", href: "/darshan" },
    { name: "Puja", href: "/puja" },
    { name: "Yatra Packages", href: "/yatra" },
    { name: "Prasadam", href: "/prasadam" },
    { name: "Chadhava", href: "/chadhava" },
  ];

  const handleLogout = () => {
    logoutUser();
    setIsMenuOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm safe-area-top">
      <TopBar />
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex flex-col items-center leading-none">
            <img src={namanLogo} alt="Naman" className="h-10 md:h-14 w-auto object-contain" />
            <span className="text-[5.5px] md:text-[7.5px] font-bold text-primary uppercase tracking-[0.05em] mt-0.5 whitespace-nowrap opacity-80 scale-95 origin-center">
              Seva • Suvidha • Samarpan
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 justify-center px-8">
            <div className="w-full max-w-2xl">
              <GlobalSearch placeholder="Search city, package, and pooja..." />
            </div>
          </div>


          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="lg:hidden p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Auth Links */}
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/referral"
                className="bg-green-600 hover:bg-green-700 text-white font-extrabold py-2 px-6 rounded-full mr-4 transition-all shadow-md hover:shadow-lg animate-pulse"
              >
                {/* Join Naman Parivaar */} Spread Sanatan Dharma
              </Link>

              {isLoading ? (
                // Subtle placeholder while auth is loading
                <div className="w-24 h-9 bg-gray-100 animate-pulse rounded-full" />
              ) : isUserAuthenticated ? (
                <>
                  <Link to="/my-trips">
                    <Button variant="outline" size="sm" className="rounded-full gap-2">
                      <User className="w-4 h-4" />
                      {user?.name || "My Account"}
                    </Button>
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-red-100 hover:text-red-600"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Link to="/login">
                  <Button variant="outline" size="sm" className="rounded-full gap-2">
                    <User className="w-4 h-4" />
                    Login
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-full hover:bg-secondary transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && (
          <div className="lg:hidden pb-4">
            <GlobalSearch placeholder="Search city, package..." />
          </div>
        )}
      </div>

      {/* Secondary Navigation Bar */}
      <div className="hidden lg:block bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-8 h-12">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`font-medium transition-colors ${isActive
                    ? "text-divine-blue font-semibold"
                    : isAtTop
                      ? "text-primary-foreground hover:text-divine-blue"
                      : "text-primary-foreground/90 hover:text-primary-foreground"
                    }`}
                >
                  {link.name}
                </Link>
              );
            })}


            {/* Astro Dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => setIsAstroDropdownOpen(true)}
              onMouseLeave={() => setIsAstroDropdownOpen(false)}
            >
              <Link
                to="/astro-naman"
                className={`font-medium transition-colors flex items-center gap-1 ${(location.pathname === "/astro-naman" || location.pathname.startsWith("/astro-naman/"))
                  ? "text-divine-blue font-semibold"
                  : isAtTop
                    ? "text-primary-foreground hover:text-divine-blue"
                    : "text-primary-foreground/90 hover:text-primary-foreground"
                  }`}
              >
                Astro
                <ChevronDown className="w-4 h-4" />
              </Link>

              {/* Dropdown Menu */}
              <div
                className={`absolute z-50 top-full left-1/2 -translate-x-1/2 pt-2 w-48 transition-all origin-top flex flex-col ${isAstroDropdownOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
                  }`}
              >
                <div className="bg-white rounded-xl shadow-xl border border-border py-2 px-1">
                  {/* <Link
                    to="/astro-naman?service=kundli"
                    className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors"
                    onClick={() => setIsAstroDropdownOpen(false)}
                  >
                    Kundli
                  </Link> */}
                  <Link
                    to="/ai-kundli"
                    className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors"
                    onClick={() => setIsAstroDropdownOpen(false)}
                  >
                    AI Kundli
                  </Link>
                  <Link
                    to="/vedic-consultants"
                    className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors"
                    onClick={() => setIsAstroDropdownOpen(false)}
                  >
                    Vedic Consultant
                  </Link>
                  <Link
                    to="/zodiac-signs"
                    className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors"
                    onClick={() => setIsAstroDropdownOpen(false)}
                  >
                    Zodiac Signs
                  </Link>

                  <Link
                    to="/astro-call"
                    className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors"
                    onClick={() => setIsAstroDropdownOpen(false)}
                  >
                    Astro Call
                  </Link>
                </div>
              </div>
            </div>

            {/* Devotee Wall Link */}
            <Link
              to="/devotee-wall"
              className={`font-medium transition-colors ${location.pathname === "/devotee-wall"
                ? "text-divine-blue font-semibold"
                : isAtTop
                  ? "text-primary-foreground hover:text-divine-blue"
                  : "text-primary-foreground/90 hover:text-primary-foreground"
                }`}
            >
              Sanatan Wall
            </Link>
          </div>
        </div>
      </div>

      {/* Payment Gateway Banner */}
      <div className="hidden lg:block bg-primary/10 border-t border-primary/20">
        <div className="container mx-auto px-4 overflow-hidden">
          <div className="flex items-center h-8 text-primary animate-marquee-continuous w-max">
            {/* Set 1 */}
            <div className="flex items-center gap-2 pr-12">
              <CreditCard className="w-4 h-4" />

            </div>
            <div className="flex items-center gap-2 pr-12">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-medium whitespace-nowrap">100% Darshan Guaranteed</span>
            </div>
            <div className="flex items-center gap-2 pr-12">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-medium whitespace-nowrap">India’s Largest Community for Devotees</span>
            </div>

            {/* Set 2 */}
            <div className="flex items-center gap-2 pr-12">
              <CreditCard className="w-4 h-4" />

            </div>
            <div className="flex items-center gap-2 pr-12">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-medium whitespace-nowrap">100% Darshan Guaranteed</span>
            </div>
            <div className="flex items-center gap-2 pr-12">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-medium whitespace-nowrap">India’s Largest Community for Devotees</span>
            </div>

            {/* Set 3 */}
            <div className="flex items-center gap-2 pr-12">
              <CreditCard className="w-4 h-4" />

            </div>
            <div className="flex items-center gap-2 pr-12">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-medium whitespace-nowrap">100% Darshan Guaranteed</span>
            </div>
            <div className="flex items-center gap-2 pr-12">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-medium whitespace-nowrap">India’s Largest Community for Devotees</span>
            </div>

            {/* Set 4 */}
            <div className="flex items-center gap-2 pr-12">
              <CreditCard className="w-4 h-4" />

            </div>
            <div className="flex items-center gap-2 pr-12">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-medium whitespace-nowrap">100% Darshan Guaranteed</span>
            </div>
            <div className="flex items-center gap-2 pr-12">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-medium whitespace-nowrap">India’s Largest Community for Devotees</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-t border-border shadow-lg">
          <nav className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`px-4 py-3 rounded-lg transition-colors font-medium ${isActive
                      ? "bg-secondary text-primary font-bold"
                      : "text-foreground hover:bg-secondary"
                      }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                );
              })}



              {/* Mobile Astro Links */}
              <div className="flex flex-col gap-1 border-t border-b border-border py-2 my-1">
                <Link
                  to="/astro-naman"
                  className="px-4 py-2 rounded-lg text-foreground font-semibold hover:bg-secondary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Astro Services
                </Link>
                <div className="pl-8 flex flex-col gap-1">
                  {/* <Link
                    to="/astro-naman?service=kundli"
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-secondary transition-colors text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Kundli
                  </Link> */}
                  <Link
                    to="/ai-kundli"
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-secondary transition-colors text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    AI Kundli
                  </Link>
                  <Link
                    to="/vedic-consultants"
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-secondary transition-colors text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Vedic Consultant
                  </Link>
                  <Link
                    to="/zodiac-signs"
                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-secondary transition-colors text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Zodiac Signs
                  </Link>
                </div>
              </div>

              {/* Mobile Devotee Wall Link */}
              <Link
                to="/devotee-wall"
                className={`px-4 py-3 rounded-lg transition-colors font-medium ${location.pathname === "/devotee-wall"
                  ? "bg-secondary text-primary font-bold"
                  : "text-foreground hover:bg-secondary"
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Sanatan Wall
              </Link>

              <hr className="my-2 border-border" />
              {isUserAuthenticated ? (
                <>
                  <Link
                    to="/my-trips"
                    className="px-4 py-3 rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {user?.name || "My Account"}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium text-left flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-3 rounded-lg border border-border text-center font-medium hover:bg-secondary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
