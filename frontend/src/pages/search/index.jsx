import React, { useEffect, useState } from 'react';
import UserLayout from '@/layout/userLayout';
import DashboardLayout from '@/layout/dashboardLayout';
import { useSelector, useDispatch } from 'react-redux';
import { getAllUsers, getAboutUser } from '@/config/redux/action/authAction';
import Styles from './index.module.css';
import { useRouter } from 'next/router';
import { sendConnectionRequest } from '@/config/redux/action/authAction';

const BASE_URL = "https://proconnect-ljsc.onrender.com";

export default function Search() {
  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");

  const router = useRouter();

  const handleConnect = async (connectionId) => {
    const token = localStorage.getItem("token");

    await dispatch(
      sendConnectionRequest({
        token,
        connectionId
      })
    );

    dispatch(getAllUsers({ token }));
  };

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      if (!authState.profileFetched) {
        dispatch(getAboutUser({ token }));
      }
      dispatch(getAllUsers({ token }));
    }
  }, [dispatch]);

  const getImageUrl = (filePath) => {
    if (!filePath || typeof filePath !== "string") {
      return null;
    }

    const cleanPath = filePath.trim();

    if (!cleanPath || cleanPath === "default.jpg") {
      return null;
    }

    if (
      cleanPath.startsWith("http://") ||
      cleanPath.startsWith("https://")
    ) {
      return cleanPath;
    }

    const normalizedPath = cleanPath.startsWith("/")
      ? cleanPath.slice(1)
      : cleanPath;

    return encodeURI(`${BASE_URL}/${normalizedPath}`);
  };

  // Safely extract the user list whether Redux saved it in allProfiles or connections
  const profilesList =
    Array.isArray(authState.allProfiles) && authState.allProfiles.length > 0
      ? authState.allProfiles
      : Array.isArray(authState.connections)
      ? authState.connections
      : [];

  // Filter users based on search input
  const filteredUsers = profilesList.filter((item) => {
    const userObj = item.userId || item;
    const name = userObj.name || "";
    const username = userObj.username || "";
    const term = searchTerm.toLowerCase();

    return name.toLowerCase().includes(term) || username.toLowerCase().includes(term);
  });

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={Styles.searchContainer}>
          {/* Instagram Search Input Header */}
          <div className={Styles.searchHeader}>
            <div className={Styles.searchInputWrapper}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className={Styles.searchIcon}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={Styles.searchInput}
              />
              {searchTerm && (
                <button
                  className={Styles.clearBtn}
                  onClick={() => setSearchTerm("")}
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* User List */}
          <div className={Styles.usersList}>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((item) => {
                const user = item.userId || item;
                const name = user.name || "User";
                const username = user.username || "username";
                const profilePic = user.profilePicture;
                const avatarUrl = getImageUrl(profilePic);

                return (
                  <div onClick={() => router.push(`/viewprofile/${user.username}`)} key={user._id || item.id || Math.random()} className={Styles.userCard}>
                    <div className={Styles.userInfoLeft}>
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={username}
                          className={Styles.avatarImg}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className={Styles.panelAvatarFallback} aria-hidden="true">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={Styles.topProfileAvatarIcon}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                          </svg>

                        </div>
                      )}
                      <div className={Styles.userTextDetails}>
                        <span className={Styles.usernameText}>{username}</span>
                        <span className={Styles.nameText}>@{name}</span>
                        
                      </div>
                    </div>
                    {user.connectionStatus === "none" && (
                      <button
                        className={Styles.followBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConnect(user._id);
                        }}
                      >
                        Connect
                      </button>
                    )}

                    {user.connectionStatus === "pending" && (
                      <button
                        className={Styles.followBtn}
                        disabled
                        onClick={(e) => e.stopPropagation()}
                      >
                        Pending
                      </button>
                    )}

                    {user.connectionStatus === "incoming" && (
                      <button
                        className={Styles.followBtn}
                        disabled
                        onClick={(e) => e.stopPropagation()}
                      >
                        Incoming
                      </button>
                    )}

                    {user.connectionStatus === "connected" && (
                      <button
                        className={Styles.followBtn}
                        disabled
                        onClick={(e) => e.stopPropagation()}
                      >
                        Connected
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className={Styles.noResults}>No accounts found.</div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}