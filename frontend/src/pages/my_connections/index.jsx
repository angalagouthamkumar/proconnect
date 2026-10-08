import React, { use, useEffect } from "react";
import UserLayout from "@/layout/userLayout";
import DashboardLayout from "@/layout/dashboardLayout";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import Styles from "./index.module.css";
import {
  getMyConnectionRequests,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getMyConnections
} from "@/config/redux/action/authAction";
import { useRouter } from "next/router";

export default function MyConnections() {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const router = useRouter();

  const BASE_URL = "https://proconnect-ljsc.onrender.com";

  

  useEffect(() => {
    dispatch(getMyConnectionRequests({token : localStorage.getItem("token")}));
  }, [dispatch]);

  useEffect(() => {
    if(authState.connectionRequests.length !== 0) {
      console.log("Connection Requests:", authState.connectionRequests);
    }
  }, [authState.connectionRequests]);


  const handleAccept = async (requestId) => {
    const token = localStorage.getItem("token");

    await dispatch(
      acceptConnectionRequest({
        token,
        requestId
      })
    );

    dispatch(getMyConnectionRequests({ token }));
    dispatch(getMyConnections({ token }));
  };

  const handleReject = async (requestId) => {
    const token = localStorage.getItem("token");

    await dispatch(
      rejectConnectionRequest({
        token,
        requestId
      })
    );

    dispatch(getMyConnectionRequests({ token }));
  };
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

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={Styles.page}>
          <h1 className={Styles.title}>My Connections</h1>

          {authState.connectionRequests.length === 0 ? (
            <p className={Styles.empty}>
              No connection requests found.
            </p>
          ) : (
            <div className={Styles.list}>
              {authState.connectionRequests.map((request) => (
                <div
                  key={request._id}
                  className={Styles.connectionCard}
                  onClick={() => router.push(`/viewprofile/${request.userId.username}`)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Left: Profile + Name + Username */}
                  <div className={Styles.userInfo}>
                    {request.userId?.profilePicture ? (
                      <img
                        src={getImageUrl(request.userId.profilePicture)}
                        alt={request.userId.name}
                        className={Styles.profilePic}
                      />
                    ) : (
                      <div className={Styles.panelAvatarFallback} aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={Styles.topProfileAvatarIcon}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>

                      </div>
                    )}

                    <div className={Styles.userDetails}>
                      <h2>{request.userId?.name}</h2>
                      <p>@{request.userId?.username}</p>
                    </div>
                  </div>

                  {/* Right: Accept + Reject */}
                  <div className={Styles.actions}>
                    <button
                      className={Styles.acceptButton}
                      onClick={(e) => {
                      e.stopPropagation();
                      handleAccept(request._id);
                    }}
                    >
                      Accept
                    </button>

                    <button
                      className={Styles.rejectButton}
                      onClick={(e) => {
                      e.stopPropagation();
                      handleReject(request._id);
                    }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}