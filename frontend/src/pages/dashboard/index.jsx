import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import {
  getallposts,
  createPost,
  deletePost,
  likePost,
  getCommentsByPost,
  addComment,
} from "@/config/redux/action/postAction";
import { getAboutUser } from "@/config/redux/action/authAction";
import { resetpostid } from "@/config/redux/reducer/postReducer";
import UserLayout from "@/layout/userLayout";
import DashboardLayout from "@/layout/dashboardLayout";
import Styles from "./style.module.css";

const BASE_URL = "http://localhost:5000";

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const postState = useSelector((state) => state.posts);

  const [postContent, setPostContent] = useState("");
  const [fileContent, setFileContent] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [optimisticLikes, setOptimisticLikes] = useState({});
  const [pendingLikeIds, setPendingLikeIds] = useState({});
  // Keep populated author data if the like reducer replaces userId with a plain ID.
  const authorCache = useRef({});

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/dashboard");
      return;
    }

    dispatch(getallposts());

    if (!authState.user || !authState.profileFetched) {
      dispatch(getAboutUser({ token }));
    }
  }, [dispatch, authState.user, authState.profileFetched]);

  if (!authState.user) {
    return (
      <UserLayout>
        <DashboardLayout>
          <h2>Loading...</h2>
        </DashboardLayout>
      </UserLayout>
    );
  }

  const profilePic =
    authState.user?.profilePicture || authState.user?.userId?.profilePicture;
  const currentUserId = authState.user?._id || authState.user?.userId?._id;
  const hasCustomPic = profilePic && profilePic !== "default.jpg";

  const handleUpload = async () => {
    if (!postContent.trim() && !fileContent) return;

    const res = await dispatch(createPost([fileContent, postContent]));
    if (createPost.fulfilled.match(res)) {
      dispatch(getallposts());
    }

    setPostContent("");
    setFileContent(null);
  };

  const handleDelete = async (postId) => {
    const res = await dispatch(deletePost({ postId }));
    if (deletePost.fulfilled.match(res)) {
      dispatch(getallposts());
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
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

  const postsList = [...rawPosts].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Cache populated author details before any like response can overwrite them.
  postsList.forEach((post) => {
    const author = post.userId;
    if (author && typeof author === "object") {
      const authorId = author._id || author.id;
      if (authorId) {
        authorCache.current[String(post._id)] = {
          ...(authorCache.current[String(post._id)] || {}),
          ...author,
        };
      }
    }
  });

  const getPostLikeInfo = (post) => {
    const postId = String(post._id);
    const cached = optimisticLikes[postId];
    const rawLikes = post.likes;
    const likesCount = Array.isArray(rawLikes)
      ? rawLikes.length
      : Number(rawLikes) || 0;
    const likedUsers = Array.isArray(post.likedBy)
      ? post.likedBy
      : Array.isArray(post.likesBy)
      ? post.likesBy
      : Array.isArray(rawLikes)
      ? rawLikes
      : [];
    const isLiked = currentUserId
      ? likedUsers.some((like) => {
          const likeUserId =
            typeof like === "string" ? like : like?._id || like?.id || like?.userId;
          return likeUserId && String(likeUserId) === String(currentUserId);
        })
      : false;

    return {
      liked: cached ? cached.liked : isLiked,
      count: cached ? cached.count : likesCount,
    };
  };

  const handleLike = async (post) => {
    const postId = String(post._id);
    if (pendingLikeIds[postId]) return;

    const previous = getPostLikeInfo(post);
    const next = { liked: !previous.liked, count: Math.max(0, previous.count + (previous.liked ? -1 : 1)) };

    setOptimisticLikes((current) => ({ ...current, [postId]: next }));
    setPendingLikeIds((current) => ({ ...current, [postId]: true }));

    try {
      const result = await dispatch(likePost({ postId: post._id }));
      if (likePost.rejected.match(result)) {
        setOptimisticLikes((current) => ({ ...current, [postId]: previous }));
      } else {
        // Only sync a numeric count when the API explicitly returns one.
        const responsePost = result.payload?.post || result.payload?.data || result.payload;
        const responseLikes = responsePost?.likes;
        if (typeof responseLikes === "number") {
          setOptimisticLikes((current) => ({
            ...current,
            [postId]: { ...next, count: responseLikes },
          }));
        }
      }
    } catch (error) {
      setOptimisticLikes((current) => ({ ...current, [postId]: previous }));
    } finally {
      setPendingLikeIds((current) => {
        const updated = { ...current };
        delete updated[postId];
        return updated;
      });
    }
  };

  const getImageUrl = (filePath) => {
    if (!filePath || filePath.trim() === "") return null;
    if (filePath.startsWith("http://") || filePath.startsWith("https://"))
      return filePath;

    let cleanPath = filePath.trim();
    if (cleanPath.startsWith("/")) cleanPath = cleanPath.slice(1);

    return encodeURI(`${BASE_URL}/${cleanPath}`);
  };

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={Styles.home}>
          {/* Create Post Card */}
          <div className={Styles.createPost}>
            <div className={Styles.profileImageContainer}>
              {hasCustomPic ? (
                <img
                  src={getImageUrl(profilePic)}
                  alt="Profile"
                  className={Styles.profileImg}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
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
              )}
            </div>

            <textarea
              onChange={(e) => setPostContent(e.target.value)}
              value={postContent}
              placeholder="What's on your mind?"
              className={Styles.textArea}
            />

            {/* Upload File Icon Label */}
            <label
              htmlFor="fileUpload"
              className={Styles.uploadLabel}
              title="Attach image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className={Styles.uploadSvg}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
            </label>
            <input
              onChange={(e) => setFileContent(e.target.files[0])}
              id="fileUpload"
              type="file"
              accept="image/*"
              hidden
            />

            {(postContent.length > 0 || fileContent) && (
              <button onClick={handleUpload} className={Styles.postBtn}>
                Post
              </button>
            )}
          </div>

          {/* Feed */}
          <div className={Styles.postContainer}>
            {postsList.length > 0 ? (
              postsList.map((post) => {
                const liveUser = post.userId && typeof post.userId === "object"
                  ? post.userId
                  : {};
                const userObj = {
                  ...(authorCache.current[String(post._id)] || {}),
                  ...liveUser,
                };
                const userPic = userObj.profilePicture;
                const userName = userObj.username || userObj.name || "User";
                const postAuthorId =
                  userObj._id || userObj.id ||
                  (typeof post.userId === "string" ? post.userId : null);
                const likeInfo = getPostLikeInfo(post);

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
                    {/* Header */}
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
                        <span className={Styles.username}>{userName}</span>
                      </div>

                      {/* Delete Icon Button */}
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

                    {/* Image / Media */}
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

                    {/* Actions */}
                    <div className={Styles.instaActions}>
                      <div className={Styles.actionLeft}>
                        <button
                          type="button"
                          onClick={() => handleLike(post)}
                          disabled={Boolean(pendingLikeIds[String(post._id)])}
                          aria-label={likeInfo.liked ? "Unlike post" : "Like post"}
                          aria-pressed={likeInfo.liked}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            border: "none",
                            background: "transparent",
                            cursor: pendingLikeIds[String(post._id)] ? "wait" : "pointer",
                            opacity: pendingLikeIds[String(post._id)] ? 0.7 : 1,
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill={likeInfo.liked ? "#ed4956" : "none"}
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke={likeInfo.liked ? "#ed4956" : "currentColor"}
                            className={Styles.actionIcon}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                            />
                          </svg>
                        </button>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={async () =>
                            await dispatch(
                              getCommentsByPost({ postId: post._id })
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              dispatch(getCommentsByPost({ postId: post._id }));
                            }
                          }}
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

                    {/* Likes */}
                    <div className={Styles.likesCount}>
                      {likeInfo.count} {likeInfo.count === 1 ? "like" : "likes"}
                    </div>

                    {/* Caption */}
                    {post.body && (
                      <div className={Styles.caption}>
                        <span className={Styles.captionUsername}>
                          {userName}
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
              <p className={Styles.noPosts}>No posts available</p>
            )}
          </div>
        </div>

        {/* Instagram Comment Modal Overlay */}
        {postState?.postId && (
          <div
            onClick={async () => await dispatch(resetpostid())}
            className={Styles.commentsModalOverlay}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={Styles.commentsModalBox}
            >
              {/* Header */}
              <div className={Styles.modalHeader}>
                <h3>Comments</h3>
                <button
                  className={Styles.modalCloseBtn}
                  onClick={async () => await dispatch(resetpostid())}
                >
                  &times;
                </button>
              </div>

              {/* Scrollable Comments Container */}
              <div className={Styles.allComments}>
                {postState?.comments && postState.comments.length > 0 ? (
                  postState.comments.map((comment) => {
                    const cUser = comment.userId && typeof comment.userId === "object"
                      ? comment.userId
                      : {};
                    const cUsername = cUser.username || cUser.name || "User";
                    const cUserPic = cUser.profilePicture;

                    return (
                      <div
                        key={comment._id || `${comment.postId || "comment"}-${comment.createdAt || comment.body || comment.text}`}
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
                            {cUsername}
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
                    No comments yet. Be the first to comment!
                  </div>
                )}
              </div>

              {/* Input Bar */}
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