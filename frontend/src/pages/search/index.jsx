import React, { useEffect, useState } from 'react';
import UserLayout from '@/layout/userLayout';
import DashboardLayout from '@/layout/dashboardLayout';
import { useSelector, useDispatch } from 'react-redux';
import { getAllUsers, getAboutUser } from '@/config/redux/action/authAction';
import Styles from './index.module.css';
import { useRouter } from 'next/router';

const BASE_URL = "http://localhost:5000";

export default function Search() {
  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");

  const router = useRouter();

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
    if (!filePath || filePath.trim() === "" || filePath === "default.jpg") return null;
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;

    let cleanPath = filePath.trim();
    if (cleanPath.startsWith("/")) cleanPath = cleanPath.slice(1);

    return encodeURI(`${BASE_URL}/${cleanPath}`);
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
                        <div className={Styles.avatarFallback}>
                          {(username[0] || name[0] || "U").toUpperCase()}
                        </div>
                      )}
                      <div className={Styles.userTextDetails}>
                        <span className={Styles.usernameText}>{username}</span>
                        <span className={Styles.nameText}>@{name}</span>
                        
                      </div>
                    </div>
                    <button className={Styles.followBtn}>Follow</button>
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