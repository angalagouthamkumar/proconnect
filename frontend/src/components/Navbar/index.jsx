import React from 'react';
import Style from "./Navbar.module.css";
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { reset } from '@/config/redux/reducer/authReducer';

export default function Navbar() {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);

  
  const isAuthenticated = authState.profileFetched || authState.LoggedIn;

  
  const isAuthPage = router.pathname === "/login" || router.pathname === "/register";
  const isLandingPage = router.pathname === "/";

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(reset());
    router.push("/login");
  };

  return (
    <div className={Style.container}>
      <nav className={Style.nav}>
        <div className={Style.navleft}>
          <h2 style={{ cursor: "pointer" }} onClick={() => router.push("/")}>
            Pro Connect
          </h2>
        </div>

        
        {!isAuthPage && (
          <div className={Style.navright} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {isAuthenticated ? (
              <>
                <div onClick={() => router.push("/dashboard")} className={Style.navbutton}>
                  {authState.profileFetched && authState.user && (
                    <div>Hey {authState.user.name}</div>
                  )}
                </div>
              
                {!isLandingPage && (
                  <div onClick={handleLogout} className={Style.navbutton} style={{ cursor: 'pointer' }}>
                    Logout
                  </div>
                )}
              </>
            ) : (
              <div onClick={() => router.push("/login")} className={Style.navbutton}>
                Be a part of us
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}