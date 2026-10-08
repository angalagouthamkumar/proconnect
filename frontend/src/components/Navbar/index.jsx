
import React, { useState, useEffect, useRef } from 'react';
import Style from "./Navbar.module.css";
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { reset } from '@/config/redux/reducer/authReducer';
import { getImageUrl } from '../../utils/images.js';

export default function Navbar() {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isAuthenticated = authState.profileFetched || authState.LoggedIn;

  const isAuthPage =
    router.pathname === "/login" || router.pathname === "/register";

  const isLandingPage = router.pathname === "/";

  const profiles = Array.isArray(authState.allProfiles)
    ? authState.allProfiles
    : [];

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(reset());
    router.push("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleMenuNavigation = (path) => {
    setMenuOpen(false);
    router.push(path);
  };

  return (
    <div className={Style.container}>
      <nav className={Style.nav}>
        <div className={Style.navleft}>
          <h2
            style={{ cursor: "pointer" }}
            onClick={() => router.push("/")}
          >
            Pro Connect
          </h2>
        </div>

        {!isAuthPage && (
          <div
            className={Style.navright}
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            {isAuthenticated ? (
              <>
                <div
                  onClick={() => router.push("/dashboard")}
                  className={Style.username}
                >
                  {authState.profileFetched && authState.user && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push("/profile");
                      }}
                      className={Style.profileLink}
                    >
                      Hey {authState.user.name}
                    </div>
                  )}
                </div>

                {!isLandingPage && (
                  <>
                    {/* Desktop Logout */}
                    <div
                      onClick={handleLogout}
                      className={`${Style.navbutton} ${Style.desktopLogout}`}
                      style={{ cursor: "pointer" }}
                    >
                      Logout
                    </div>

                    {/* Mobile Menu */}
                    <div
                      className={Style.mobileMenuWrapper}
                      ref={menuRef}
                    >
                      <button
                        type="button"
                        className={Style.menuButton}
                        onClick={() => setMenuOpen((prev) => !prev)}
                        aria-label="Open navigation menu"
                        aria-expanded={menuOpen}
                      >
                        ☰
                      </button>

                      {menuOpen && (
                        <div className={Style.dropdownMenu}>

                          <button
                            type="button"
                            onClick={() =>
                              handleMenuNavigation("/dashboard")
                            }
                          >
                            Home
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleMenuNavigation("/search")
                            }
                          >
                            Search
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleMenuNavigation("/my_connections")
                            }
                          >
                            My Connections
                          </button>

                          {/* Top Profiles */}
                          <div className={Style.topProfilesSection}>
                            <div className={Style.topProfilesTitle}>
                              Top profiles
                            </div>

                            {profiles.length > 0 ? (
                              profiles.map((profile) => {
                                const name =
                                  profile.userId?.name ||
                                  profile.name ||
                                  profile.username ||
                                  "User";

                                const username =
                                  profile.userId?.username ||
                                  profile.username;

                                const pic = getImageUrl(
                                  profile.userId?.profilePicture ||
                                  profile.profilePicture
                                );

                                return (
                                  <div
                                    key={profile._id || profile.id}
                                    className={Style.mobileProfileRow}
                                    onClick={() => router.push(`/viewprofile/${username}`)}
                                    style={{ cursor: "pointer" }}
                                  >
                                    {pic ? (
                                      <img
                                        src={pic}
                                        alt={name}
                                        className={Style.mobileProfileAvatar}
                                      />
                                    ) : (
                                      <div className={Style.mobileProfileAvatarFallback}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                        </svg>

                                      </div>
                                    )}

                                    <div className={Style.mobileProfileText}>
                                      <p className={Style.mobileProfileName}>
                                        {name}
                                      </p>

                                      {username && (
                                        <p
                                          className={
                                            Style.mobileProfileUsername
                                          }
                                        >
                                          @{username}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className={Style.mobileProfileEmpty}>
                                No profiles found
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              handleLogout();
                            }}
                          >
                            Logout
                          </button>

                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div
                onClick={() => router.push("/login")}
                className={Style.navbutton}
              >
                Be a part of us
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}
