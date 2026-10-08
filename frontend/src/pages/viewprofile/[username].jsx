import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import {
  getallposts,
  likePost,
  getCommentsByPost,
  addComment,
  deletePost,
} from "@/config/redux/action/postAction";
import { getAboutUser, getAllUsers, getUserProfileByUsername } from "@/config/redux/action/authAction";
import { resetpostid } from "@/config/redux/reducer/postReducer";
import UserLayout from "@/layout/userLayout";
import DashboardLayout from "@/layout/dashboardLayout";
import { sendConnectionRequest } from '@/config/redux/action/authAction';

import Styles from "./index.module.css";
import P from "../profile/index.module.css";

const BASE_URL = "http://localhost:5000";

export default function ViewProfile() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { username } = router.query;

  const authState = useSelector((state) => state.auth);
  // Match selector with Homepage (Dashboard.jsx)
  const postState = useSelector((state) => state.posts || state.post);

  const [commentText, setCommentText] = useState("");

  // Layout-only state: which tab is open, and the viewed user's profile data
  const [tab, setTab] = useState("posts");
  const [viewedProfile, setViewedProfile] = useState(null);
  const [profileStatus, setProfileStatus] = useState("loading");
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/dashboard");
      return;
    }

    dispatch(getallposts());
    dispatch(getAllUsers({ token }));

    if (!authState.user || !authState.profileFetched) {
      dispatch(getAboutUser({ token }));
    }
  }, [dispatch, authState.user, authState.profileFetched, router]);

  // Load this username's real profile data (bio, work, education)
  useEffect(() => {
    if (!username) return;
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    let cancelled = false;
    setViewedProfile(null);
    setProfileStatus("loading");
    setProfileError("");

    dispatch(getUserProfileByUsername({ username, token })).then((result) => {
      if (cancelled) return;
      if (getUserProfileByUsername.fulfilled.match(result)) {
        setViewedProfile(result.payload?.user || null);
        setProfileStatus("ready");
      } else {
        setProfileError(
          typeof result.payload === "string" ? result.payload : "Could not load this profile"
        );
        setProfileStatus("notfound");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [dispatch, username]);

  // Your own username is edited on /profile, so send you there
  useEffect(() => {
    if (
      username &&
      authState.user?.username &&
      String(authState.user.username).toLowerCase() === String(username).toLowerCase()
    ) {
      router.replace("/profile");
    }
  }, [username, authState.user, router]);

  const currentUserId = authState.user?._id || authState.user?.userId?._id;

  const getImageUrl = (filePath) => {
    if (!filePath || filePath.trim() === "" || filePath === "default.jpg")
      return null;
    if (filePath.startsWith("http://") || filePath.startsWith("https://"))
      return filePath;

    let cleanPath = filePath.trim();
    if (cleanPath.startsWith("/")) cleanPath = cleanPath.slice(1);

    return encodeURI(`${BASE_URL}/${cleanPath}`);
  };
  const handleConnect = async (connectionId) => {
    const token = localStorage.getItem("token");

    try {
      const result = await dispatch(
        sendConnectionRequest({
          token,
          connectionId,
        })
      );

      if (sendConnectionRequest.fulfilled.match(result)) {
        await dispatch(getAllUsers({ token }));
        await dispatch(getallposts());
      }
    } catch (error) {
      console.error("Connection request failed:", error);
    }
  };

  const handleDelete = async (postId) => {
    const res = await dispatch(deletePost({ postId }));
    if (deletePost.fulfilled.match(res)) {
      dispatch(getallposts());
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !postState?.postId) return;

    const res = await dispatch(
      addComment({ postId: postState.postId, body: commentText })
    );

    if (addComment.fulfilled.match(res)) {
      dispatch(getCommentsByPost({ postId: postState.postId }));
      setCommentText("");
    }
  };

  const rawPosts = Array.isArray(postState?.posts)
    ? postState.posts
    : Array.isArray(postState?.posts?.posts)
    ? postState.posts.posts
    : [];

  // Robust filter that prevents posts from disappearing when liked
  const userPosts = [...rawPosts]
    .filter((post) => {
      if (!post || !username) return false;
      const userObj =
        typeof post.userId === "object" ? post.userId : null;
      const postUsername =
        userObj?.username || userObj?.name || (typeof post.userId === "string" ? post.userId : null);

      return (
        postUsername &&
        String(postUsername).toLowerCase() === String(username).toLowerCase()
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const profilesList =
      Array.isArray(authState.allProfiles) && authState.allProfiles.length > 0
        ? authState.allProfiles
        : Array.isArray(authState.connections)
        ? authState.connections
        : [];

  // ---- Layout data (read-only, derived from the data above) ----
  const viewedListItem = profilesList.find((item) => {
    const u = item.userId || item;
    return String(u.username || "").toLowerCase() === String(username || "").toLowerCase();
  });
  const viewedListUser = viewedListItem?.userId || viewedListItem || {};
  const headerUser = viewedProfile?.userId || viewedListUser;
  const headerName = headerUser.name || headerUser.username || username || "User";
  const headerPicUrl = getImageUrl(headerUser.profilePicture);
  const headerId = viewedListUser._id || headerUser._id;
  const connectionStatus = viewedListUser.connectionStatus;

  const bio = viewedProfile?.bio || "";
  const work = viewedProfile?.currentwork || {};
  const pastWork = Array.isArray(viewedProfile?.postwork) ? viewedProfile.postwork : [];
  const education = Array.isArray(viewedProfile?.education) ? viewedProfile.education : [];
  const headline = [work.position, work.company].filter(Boolean).join(" at ");
  const likesReceived = userPosts.reduce((sum, post) => {
    const likes = Array.isArray(post.likes) ? post.likes.length : Number(post.likes) || 0;
    return sum + likes;
  }, 0);

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={P.page}>
          {/* Back */}
          <div className={Styles.navHeader}>
            <button className={Styles.backBtn} onClick={() => router.back()}>
              &larr; Back
            </button>
          </div>

          {profileStatus === "notfound" ? (
            <div className={P.card} role="alert">
              <h2 className={P.cardTitle}>Profile unavailable</h2>
              <p>{profileError}</p>
            </div>
          ) : (
            <>
              {/* Profile header (read-only for everyone) */}
              <section className={P.headerCard} aria-label="Profile header">
                <div className={P.cover} />
                <div className={P.headerBody}>
                  <div className={P.avatarRow}>
                    <div className={P.avatarWrap}>
                      {headerPicUrl ? (
                        <img
                          src={headerPicUrl}
                          alt={`${headerName}'s profile`}
                          className={P.avatar}
                        />
                      ) : (
                        <div className={P.avatarFallback}>
                          {(headerName[0] || "U").toUpperCase()}
                        </div>
                      )}
                    </div>

                    {connectionStatus === "none" && (
                      <button
                        className={P.primaryBtn}
                        onClick={() => handleConnect(headerId)}
                      >
                        Connect
                      </button>
                    )}
                    {connectionStatus === "pending" && (
                      <button className={P.secondaryBtn} disabled>
                        Pending
                      </button>
                    )}
                    {connectionStatus === "incoming" && (
                      <button className={P.secondaryBtn} disabled>
                        Incoming
                      </button>
                    )}
                    {connectionStatus === "connected" && (
                      <button className={P.secondaryBtn} disabled>
                        Connected
                      </button>
                    )}
                  </div>

                  <h1 className={P.displayName}>{headerName}</h1>
                  <p className={P.handle}>@{headerUser.username || username}</p>
                  {headline && <span className={P.workBadge}>{headline}</span>}
                  {bio && <p className={P.bioText}>{bio}</p>}

                  <div className={P.stats}>
                    <div>
                      <span className={P.statNumber}>{userPosts.length}</span>
                      <span className={P.statLabel}>Posts</span>
                    </div>
                    <div>
                      <span className={P.statNumber}>{likesReceived}</span>
                      <span className={P.statLabel}>Likes received</span>
                    </div>
                  </div>
                </div>

                <div className={P.tabs} role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "posts"}
                    className={`${P.tab} ${tab === "posts" ? P.tabActive : ""}`}
                    onClick={() => setTab("posts")}
                  >
                    Posts
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "about"}
                    className={`${P.tab} ${tab === "about" ? P.tabActive : ""}`}
                    onClick={() => setTab("about")}
                  >
                    About
                  </button>
                </div>
              </section>

              {/* About tab */}
              {tab === "about" && (
                <div className={P.sections}>
                  <section className={P.card}>
                    <h2 className={P.cardTitle}>About</h2>
                    <p className={P.bioFull}>{bio || "Not added yet"}</p>
                  </section>

                  <section className={P.card}>
                    <h2 className={P.cardTitle}>Work</h2>
                    <div className={P.infoRow}>
                      <span className={P.infoLabel}>Current</span>
                      <span className={P.infoValue}>
                        {headline ? `${headline} · ${Number(work.years) || 0} yr` : "Not added yet"}
                      </span>
                    </div>
                    {pastWork.length === 0 ? (
                      <div className={P.infoRow}>
                        <span className={P.infoLabel}>Past</span>
                        <span className={P.infoValue}>Not added yet</span>
                      </div>
                    ) : (
                      pastWork.map((w, i) => (
                        <div key={w._id || i} className={P.infoRow}>
                          <span className={P.infoLabel}>{i === 0 ? "Past" : ""}</span>
                          <span className={P.infoValue}>
                            {`${w.position || "Role"} at ${w.company || "Company"} · ${Number(w.years) || 0} yr`}
                          </span>
                        </div>
                      ))
                    )}
                  </section>

                  <section className={P.card}>
                    <h2 className={P.cardTitle}>Education</h2>
                    {education.length === 0 ? (
                      <div className={P.infoRow}>
                        <span className={P.infoLabel}>School</span>
                        <span className={P.infoValue}>Not added yet</span>
                      </div>
                    ) : (
                      education.map((e, i) => (
                        <div key={e._id || i} className={P.educationItem}>
                          <span className={P.infoValue}>
                            {e.college || e.school || "Institution"}
                          </span>
                          <span className={P.infoLabel}>
                            {[e.degree, e.fieldOfStudy].filter(Boolean).join(" · ") || "Details not added"}
                          </span>
                        </div>
                      ))
                    )}
                  </section>
                </div>
              )}

              {/* Posts Feed */}
              {tab === "posts" && (
                <div className={Styles.home}>
                {userPosts.length > 0 ? (
            userPosts.map((post) => {
              const postUser =
                typeof post.userId === "object" ? post.userId : {};

              const matchedProfile = profilesList.find((item) => {
                const user = item.userId || item;

                return (
                  String(user._id) ===
                  String(postUser._id)
                );
              });

              const userObj = matchedProfile?.userId || matchedProfile || postUser;
              const userPic = userObj.profilePicture;
              const userName = userObj.username || userObj.name || username || "User";
              const postAuthorId = userObj._id || userObj.id || post.userId;

              const isOwner =
                currentUserId &&
                postAuthorId &&
                String(currentUserId) === String(postAuthorId);
              const rawMedia =
                Array.isArray(post.media) && post.media[0]
                  ? post.media[0]
                  : null;
              const mediaUrl = getImageUrl(rawMedia);

              return (
                <div key={post._id} className={Styles.instaCard}>
                  {/* Card Header */}
                  <div className={Styles.instaHeader}>
                    <div className={Styles.headerLeft}>
                      {userPic && userPic !== "default.jpg" ? (
                        <img
                          src={getImageUrl(userPic)}
                          alt={userName}
                          className={Styles.instaAvatar}
                        />
                      ) : (
                        <div className={Styles.instaAvatarFallback}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className={Styles.profileSvg}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                            />
                          </svg>
                        </div>
                      )}
                      <span className={Styles.username}>@{userName}</span>
                    </div>

                    {/* Delete Button */}
                    {isOwner && (
                      <button
                        className={Styles.deleteIconBtn}
                        onClick={() => handleDelete(post._id)}
                        title="Delete Post"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className={Styles.deleteSvg}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Media Container */}
                  {mediaUrl && (
                    <div className={Styles.instaMediaContainer}>
                      <img
                        src={mediaUrl}
                        alt="Post media"
                        className={Styles.instaMedia}
                        onError={(e) => {
                          e.currentTarget.parentElement.style.display =
                            "none";
                        }}
                      />
                    </div>
                  )}

                  {/* Action Icons Row (Includes Like, Comment, Share & Bookmark) */}
                  <div className={Styles.instaActions}>
                    <div className={Styles.actionLeft}>
                      {/* Like Button */}
                      <div
                        className={Styles.likeBtn}
                        onClick={async () =>
                          await dispatch(likePost({ postId: post._id }))
                        }
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className={Styles.actionIcon}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                          />
                        </svg>
                      </div>

                      {/* Comment Button */}
                      <div
                        onClick={async () =>
                          await dispatch(
                            getCommentsByPost({ postId: post._id })
                          )
                        }
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className={Styles.actionIcon}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.51-.358 1.14-.42 1.693-.263a8.91 8.91 0 0 0 1.862.6Z"
                          />
                        </svg>
                      </div>

                      {/* Share Button */}
                      <div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className={Styles.actionIcon}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Bookmark / Save Button */}
                    <div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className={Styles.actionIcon}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Likes Count */}
                  <div className={Styles.likesCount}>
                    {post.likes || 0} likes
                  </div>

                  {/* Caption */}
                  {post.body && (
                    <div className={Styles.caption}>
                      <span className={Styles.captionUsername}>
                        @{userName}
                      </span>
                      <span className={Styles.captionText}>{post.body}</span>
                    </div>
                  )}

                  {/* Date */}
                  <div className={Styles.postTime}>
                    {new Date(post.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <p className={Styles.noPosts}>
              No posts available for @{username}.
            </p>
          )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Instagram Comments Modal */}
        {postState?.postId && (
          <div
            onClick={async () => await dispatch(resetpostid())}
            className={Styles.commentsModalOverlay}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={Styles.commentsModalBox}
            >
              <div className={Styles.modalHeader}>
                <h3>Comments</h3>
                <button
                  className={Styles.modalCloseBtn}
                  onClick={async () => await dispatch(resetpostid())}
                >
                  &times;
                </button>
              </div>

              <div className={Styles.allComments}>
                {postState?.comments && postState.comments.length > 0 ? (
                  postState.comments.map((comment) => {
                    const cUser = comment.userId || {};
                    const cUsername = cUser.username || cUser.name || "User";
                    const cUserPic = cUser.profilePicture;

                    return (
                      <div
                        key={comment._id || Math.random()}
                        className={Styles.commentItem}
                      >
                        {cUserPic && cUserPic !== "default.jpg" ? (
                          <img
                            src={getImageUrl(cUserPic)}
                            alt={cUsername}
                            className={Styles.commentAvatar}
                          />
                        ) : (
                          <div className={Styles.commentAvatarFallback}>
                            {(cUsername[0] || "U").toUpperCase()}
                          </div>
                        )}
                        <div className={Styles.commentTextContainer}>
                          <span className={Styles.commentUsername}>
                            @{cUsername}
                          </span>
                          <span className={Styles.commentBody}>
                            {comment.body || comment.text}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={Styles.noCommentsMessage}>
                    No comments yet.
                  </div>
                )}
              </div>

              <div className={Styles.commentInputSection}>
                <textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={1}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className={Styles.submitCommentBtn}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </UserLayout>
  );
}