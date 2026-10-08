import React, { useEffect } from 'react';
import Styles from "./index.module.css";
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { setTokenIsThere } from '@/config/redux/reducer/authReducer';
import { getAllUsers, getAboutUser } from '@/config/redux/action/authAction';
import { getImageUrl } from '../../utils/images.js';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const profiles = Array.isArray(authState.allProfiles) ? authState.allProfiles : [];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      dispatch(setTokenIsThere());
      if (!authState.profileFetched) {
        dispatch(getAboutUser({ token }));
      }
      if (Array.isArray(authState.allProfiles) && authState.allProfiles.length === 0) {
        dispatch(getAllUsers({ token }));
      }
    }
  }, [dispatch, router]);

  return (
    <div>
      <div className={Styles.container}>
        <div className={Styles.homeContainer}>
          <div className={Styles.homeleft}>
            <div className={Styles.siderBarOption} onClick={() => router.push('/search')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <p>Search</p>
            </div>

            <div className={Styles.siderBarOption} onClick={() => router.push('/dashboard')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <p>Home</p>
            </div>

            <div className={Styles.siderBarOption} onClick={() => router.push('/my_connections')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <p>My Connections</p>
            </div>
          </div>  
          <div className={Styles.homeright}></div>
        </div>

        <div className={Styles.feedContainer}>
          {children}
        </div>

        <aside className={Styles.extraContainer}>
          <h2 className={Styles.panelTitle}>Top profiles</h2>

          {profiles.length > 0 ? (
            profiles.map((profile) => {
              const name = profile.userId?.name || profile.name || profile.username || "User";
              const username = profile.userId?.username || profile.username;
              const pic = getImageUrl(profile.userId?.profilePicture || profile.profilePicture);

              return (
                <div key={profile._id || profile.id} className={Styles.panelRow} onClick={() => router.push(`/viewprofile/${username}`)} style={{ cursor: "pointer" }}>
                  {pic ? (
                    <img src={pic} alt={name} className={Styles.panelAvatar} />
                  ) : (
                   <div className={Styles.panelAvatarFallback} aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6" className={Styles.topProfileAvatarIcon}>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>

                  </div>
                  )}
                  <div className={Styles.panelText}>
                    <p className={Styles.panelName}>{name}</p>
                    {username && <p className={Styles.panelUsername}>@{username}</p>}
                  </div>
                </div>
              );
            })
          ) : (
            <p className={Styles.panelEmpty}>No profiles found</p>
          )}
        </aside>
      </div>
    </div>
  );
}