import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Phone,
  User,
  LogOut,
} from "lucide-react";

import TopBar from "./TopBar";
import namanLogo from "@/assets/naman.webp";
import { useAuth } from "@/context/AuthContext";

interface AstroCallHeaderProps {
  onChatClick: () => void;
  onCallClick: () => void;
  onLoginClick: () => void;
}

const AstroCallHeader = ({
  onChatClick,
  onCallClick,
  onLoginClick,
}: AstroCallHeaderProps) => {
  const navigate = useNavigate();

  const {
    isUserAuthenticated,
    user,
    logoutUser,
  } = useAuth();

  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="w-full">
      {/* Orange Top Bar */}
      <TopBar />

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="h-[72px] flex items-center justify-between">

            {/* Logo */}
            <Link to="/">
              <img
                src={namanLogo}
                alt="Logo"
                className="h-10 w-auto"
              />
            </Link>

            {/* Center Buttons */}
            <div className="flex items-center gap-4">

              <button
                onClick={onChatClick}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full transition"
              >
                <MessageCircle size={18} />
                Chat
              </button>

              {/* 
              <button
                onClick={onCallClick}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-full transition"
              >
                <Phone size={18} />
                Call
              </button>
              */}

            </div>

            {/* Login / Profile */}
            <div className="relative">

              {!isUserAuthenticated ? (
                <button
                  onClick={onLoginClick}
                  className="flex items-center gap-2 border px-5 py-2 rounded-full hover:border-orange-500 hover:text-orange-500"
                >
                  <User size={18} />
                  Login
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 border px-5 py-2 rounded-full"
                  >
                    <User size={18} />
                    {user?.name?.split(" ")[0] || "Profile"}
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border overflow-hidden">

                      <button
                        onClick={() => {
                          navigate("/profile");
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50"
                      >
                        My Profile
                      </button>

                      <button
                        onClick={() => {
                          navigate("/wallet");
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50"
                      >
                        Wallet
                      </button>

                      <button
                        onClick={() => {
                          logoutUser();
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50"
                      >
                        <LogOut size={18} />
                        Logout
                      </button>

                    </div>
                  )}
                </>
              )}

            </div>

          </div>
        </div>
      </nav>
    </header>
  );
};

export default AstroCallHeader;