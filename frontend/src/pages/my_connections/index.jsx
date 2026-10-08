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

export default function MyConnections() {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);

  

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
                >
                  {/* Left: Profile + Name + Username */}
                  <div className={Styles.userInfo}>
                    {request.userId?.profilePicture ? (
                      <img
                        src={request.userId.profilePicture}
                        alt={request.userId.name}
                        className={Styles.profilePic}
                      />
                    ) : (
                      <div className={Styles.profileFallback}>
                        {(request.userId?.name?.[0] || "U").toUpperCase()}
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
                      onClick={() => handleAccept(request._id)}
                    >
                      Accept
                    </button>

                    <button
                      className={Styles.rejectButton}
                      onClick={() => handleReject(request._id)}
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