import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import UserLayout from "@/layout/userLayout";
import DashboardLayout from "@/layout/dashboardLayout";
import {
  getAboutUser,
  getAllUsers,
  updateUserDetails,
  updateProfileInfo,
  uploadProfilePicture,
  uploadResume,
  removeResume
} from "@/config/redux/action/authAction";
import { getallposts } from "@/config/redux/action/postAction";
import Style from "./index.module.css";
import { getImageUrl } from '../../utils/images.js';

const MAX_PICTURE_BYTES = 2 * 1024 * 1024;
const USERNAME_RULE = /^[A-Za-z0-9_.]{3,30}$/;
const MAX_ROWS = 10;

const blankWork = { company: "", position: "", years: 0 };
const blankEducation = { school: "", college: "", degree: "", fieldOfStudy: "" };

const toWork = (w = {}) => ({
  company: w.company || "",
  position: w.position || "",
  years: Number(w.years) || 0,
});

const toEducation = (e = {}) => ({
  school: e.school || "",
  college: e.college || "",
  degree: e.degree || "",
  fieldOfStudy: e.fieldOfStudy || "",
});

function Field({ id, label, error, children }) {
  return (
    <div className={Style.field}>
      <label htmlFor={id} className={Style.label}>
        {label}
      </label>
      {children}
      {error && (
        <span className={Style.errorText} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className={Style.infoRow}>
      <span className={Style.infoLabel}>{label}</span>
      <span className={Style.infoValue}>{value || "Not added yet"}</span>
    </div>
  );
}

export default function Profile() {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const postState = useSelector((state) => state.posts);
  const fileInput = useRef(null);
  const resumeInput = useRef(null);

  const [tab, setTab] = useState("about");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);

  const user = authState.user;
  const profile = authState.profile;
  // /profile always shows the logged-in user's own data, so only they get edit controls
  const isOwner = Boolean(user?._id);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    dispatch(getallposts());
    if (!authState.user || !authState.profile) {
      dispatch(getAboutUser({ token }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, router]);

  const rawPosts = Array.isArray(postState?.posts)
    ? postState.posts
    : Array.isArray(postState?.posts?.posts)
    ? postState.posts.posts
    : [];

  const myPosts = useMemo(() => {
    if (!user?._id) return [];
    return rawPosts
      .filter((post) => {
        const author =
          post?.userId && typeof post.userId === "object"
            ? post.userId._id || post.userId.id
            : post?.userId;
        return author && String(author) === String(user._id);
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [rawPosts, user?._id]);

  const likesReceived = myPosts.reduce((sum, post) => {
    const likes = Array.isArray(post.likes) ? post.likes.length : Number(post.likes) || 0;
    return sum + likes;
  }, 0);

  if (!user || !profile) {
    return (
      <UserLayout>
        <DashboardLayout>
          <div className={Style.page} aria-busy="true">
            <div className={Style.skeletonCard}>
              <div className={Style.skeletonCover} />
              <div className={Style.skeletonLine} />
              <div className={Style.skeletonLineShort} />
            </div>
          </div>
        </DashboardLayout>
      </UserLayout>
    );
  }

  const picUrl = getImageUrl(user.profilePicture);
  const work = toWork(profile.currentwork);
  const pastWork = Array.isArray(profile.postwork) ? profile.postwork.map(toWork) : [];
  const education = Array.isArray(profile.education) ? profile.education.map(toEducation) : [];
  const headline = [work.position, work.company].filter(Boolean).join(" at ");

  const startEdit = () => {
    setForm({
      name: user.name || "",
      username: user.username || "",
      bio: profile.bio || "",
      currentwork: toWork(profile.currentwork),
      postwork: pastWork.map((w) => ({ ...w })),
      education: education.map((e) => ({ ...e })),
    });
    setErrors({});
    setFeedback(null);
    setTab("about");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setErrors({});
    setForm(null);
  };

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setWorkField = (field, value) =>
    setForm((f) => ({ ...f, currentwork: { ...f.currentwork, [field]: value } }));
  const setListItem = (key, index, field, value) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  const addItem = (key, blank) =>
    setForm((f) => (f[key].length >= MAX_ROWS ? f : { ...f, [key]: [...f[key], { ...blank }] }));
  const removeItem = (key, index) =>
    setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== index) }));

  const validate = () => {
    const found = {};
    if (!form.name.trim()) found.name = "Name is required";
    else if (form.name.trim().length > 60) found.name = "Name must be 60 characters or fewer";
    if (!USERNAME_RULE.test(form.username.trim())) {
      found.username = "3-30 characters: letters, numbers, _ or .";
    }
    if (form.bio.length > 500) found.bio = "Bio must be 500 characters or fewer";
    const years = [form.currentwork.years, ...form.postwork.map((w) => w.years)];
    if (years.some((y) => Number(y) < 0 || Number(y) > 60 || Number.isNaN(Number(y)))) {
      found.years = "Years must be between 0 and 60";
    }
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const refreshAll = async (token) => {
    await Promise.all([
      dispatch(getAboutUser({ token })),
      dispatch(getallposts()),
      dispatch(getAllUsers({ token })),
    ]);
  };

  const handleSave = async () => {
    if (!isOwner || !form || !validate()) return;
    const token = localStorage.getItem("token");
    setSaving(true);
    setFeedback(null);

    const details = await dispatch(
      updateUserDetails({ token, name: form.name.trim(), username: form.username.trim() })
    );
    if (!updateUserDetails.fulfilled.match(details)) {
      setFeedback({ type: "error", text: details.payload?.text || "Could not save your details" });
      setSaving(false);
      return;
    }

    const info = await dispatch(
      updateProfileInfo({
        token,
        bio: form.bio,
        currentwork: { ...form.currentwork, years: Number(form.currentwork.years) || 0 },
        postwork: form.postwork.map((w) => ({ ...w, years: Number(w.years) || 0 })),
        education: form.education,
      })
    );

    // Refresh so the navbar, feed, search, panel and comments all show the new data
    await refreshAll(token);
    setSaving(false);

    if (!updateProfileInfo.fulfilled.match(info)) {
      setFeedback({ type: "error", text: info.payload?.text || "Your name was saved, but the rest failed" });
      return;
    }
    setIsEditing(false);
    setForm(null);
    setFeedback({ type: "success", text: "Profile updated" });
  };

  const handlePicture = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !isOwner) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setFeedback({ type: "error", text: "Please choose a JPG or PNG image" });
      return;
    }
    if (file.size > MAX_PICTURE_BYTES) {
      setFeedback({ type: "error", text: "Image must be 2 MB or smaller" });
      return;
    }

    

    const token = localStorage.getItem("token");
    setUploading(true);
    setFeedback(null);
    const result = await dispatch(uploadProfilePicture({ token, file }));
    if (uploadProfilePicture.fulfilled.match(result)) {
      await refreshAll(token);
      setFeedback({ type: "success", text: "Profile picture updated" });
    } else {
      setFeedback({ type: "error", text: result.payload?.text || "Picture upload failed" });
    }
    setUploading(false);
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file || !isOwner) return;

    if (
      file.type !== "application/pdf" &&
      file.type !== "application/msword" &&
      file.type !==
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      setFeedback({
        type: "error",
        text: "Please choose a PDF, DOC or DOCX file",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFeedback({
        type: "error",
        text: "Resume must be 10 MB or smaller",
      });
      return;
    }

    const token = localStorage.getItem("token");

    setResumeUploading(true);
    setFeedback(null);

    const result = await dispatch(uploadResume({ token, file }));

    if (uploadResume.fulfilled.match(result)) {
      await refreshAll(token);
      setFeedback({
        type: "success",
        text: "Resume uploaded successfully",
      });
    } else {
      setFeedback({
        type: "error",
        text: result.payload?.text || "Resume upload failed",
      });
    }

    setResumeUploading(false);
  };

  const handleRemoveResume = async () => {
    const token = localStorage.getItem("token");

    setResumeUploading(true);
    setFeedback(null);

    const result = await dispatch(removeResume({ token }));

    if (removeResume.fulfilled.match(result)) {
      await refreshAll(token);

      setFeedback({
        type: "success",
        text: "Resume removed successfully",
      });
    } else {
      setFeedback({
        type: "error",
        text: result.payload?.text || "Could not remove resume",
      });
    }

    setResumeUploading(false);
  };

  return (
    <UserLayout>
      <DashboardLayout>
        <div className={Style.page}>
          {feedback && (
            <div
              className={feedback.type === "success" ? Style.feedbackSuccess : Style.feedbackError}
              role={feedback.type === "success" ? "status" : "alert"}
            >
              {feedback.text}
            </div>
          )}

          <section className={Style.headerCard} aria-label="Profile header">
            <div className={Style.cover} />
            <div className={Style.headerBody}>
              <div className={Style.avatarRow}>
                <div className={Style.avatarWrap}>
                  {picUrl ? (
                    <img
                      src={picUrl}
                      alt={`${user.name}'s profile`}
                      className={Style.avatar}
                    />
                  ) : (
                    <div className={Style.avatarFallback}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className={Style.topProfileAvatarIcon}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                        />
                      </svg>
                    </div>
                  )}
                  {isOwner && (
                    <>
                      <button
                        type="button"
                        className={Style.avatarBtn}
                        onClick={() => fileInput.current?.click()}
                        disabled={uploading}
                        aria-label="Change profile picture"
                        title="Change profile picture"
                      >
                        {uploading ? "…" : "✎"}
                      </button>
                      <input
                        ref={fileInput}
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={handlePicture}
                        hidden
                      />
                    </>
                  )}
                </div>

                {isOwner && !isEditing && (
                  <button type="button" className={Style.secondaryBtn} onClick={startEdit}>
                    Edit profile
                  </button>
                )}
              </div>

              <h1 className={Style.displayName}>{user.name}</h1>
              <p className={Style.handle}>@{user.username}</p>
              {headline && <span className={Style.workBadge}>{headline}</span>}
              {profile.bio && !isEditing && <p className={Style.bioText}>{profile.bio}</p>}

              <div className={Style.stats}>
                <div>
                  <span className={Style.statNumber}>{myPosts.length}</span>
                  <span className={Style.statLabel}>Posts</span>
                </div>
                <div>
                  <span className={Style.statNumber}>{likesReceived}</span>
                  <span className={Style.statLabel}>Likes received</span>
                </div>
              </div>
            </div>

            <div className={Style.tabs} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "about"}
                className={`${Style.tab} ${tab === "about" ? Style.tabActive : ""}`}
                onClick={() => setTab("about")}
              >
                About
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "posts"}
                className={`${Style.tab} ${tab === "posts" ? Style.tabActive : ""}`}
                onClick={() => setTab("posts")}
              >
                Posts
              </button>
            </div>
          </section>

          {tab === "about" && !isEditing && (
            <div className={Style.sections}>
              <section className={Style.card}>
                <h2 className={Style.cardTitle}>About</h2>
                <p className={Style.bioFull}>{profile.bio || "No bio yet."}</p>
              </section>

              <section className={Style.card}>
                <h2 className={Style.cardTitle}>Work</h2>
                <InfoRow label="Current" value={headline && `${headline} · ${work.years} yr`} />
                {pastWork.length === 0 ? (
                  <InfoRow label="Past" value="" />
                ) : (
                  pastWork.map((w, i) => (
                    <InfoRow
                      key={i}
                      label={i === 0 ? "Past" : ""}
                      value={`${w.position || "Role"} at ${w.company || "Company"} · ${w.years} yr`}
                    />
                  ))
                )}
              </section>

              <section className={Style.card}>
                <h2 className={Style.cardTitle}>Education</h2>
                {education.length === 0 ? (
                  <InfoRow label="School" value="" />
                ) : (
                  education.map((e, i) => (
                    <div key={i} className={Style.educationItem}>
                      <span className={Style.infoValue}>{e.college || e.school || "Institution"}</span>
                      <span className={Style.infoLabel}>
                        {[e.degree, e.fieldOfStudy].filter(Boolean).join(" · ") || "Details not added"}
                      </span>
                    </div>
                  ))
                )}
              </section>

              <section className={Style.card}>
                <h2 className={Style.cardTitle}>Resume</h2>

                {user.resume ? (
                  <div>
                    <p className={Style.infoValue}>
                      Resume uploaded
                    </p>

                    <div className={Style.formActions}>
                      <a
                        href={`https://proconnect-ljsc.onrender.com/${user.resume}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={Style.resumeDownloadBtn}
                      >
                        Download
                      </a>

                      <button
                        type="button"
                        className={Style.removeBtn}
                        onClick={handleRemoveResume}
                        disabled={resumeUploading}
                      >
                        {resumeUploading ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className={Style.infoValue}>
                      Resume not uploaded
                    </p>

                    <button
                      type="button"
                      className={Style.primaryBtn}
                      onClick={() => resumeInput.current?.click()}
                      disabled={resumeUploading}
                    >
                      {resumeUploading ? "Uploading..." : "Upload Resume"}
                    </button>

                    <input
                      ref={resumeInput}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      hidden
                    />
                  </div>
                )}
              </section>

              <section className={Style.card}>
                <h2 className={Style.cardTitle}>Account</h2>
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="Username" value={`@${user.username}`} />
              </section>
            </div>
          )}

          {tab === "about" && isEditing && form && (
            <div className={Style.card}>
              <h2 className={Style.cardTitle}>Edit profile</h2>

              <div className={Style.formGrid}>
                <Field id="pf-name" label="Name" error={errors.name}>
                  <input
                    id="pf-name"
                    className={Style.input}
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    maxLength={60}
                    autoComplete="name"
                  />
                </Field>
                <Field id="pf-username" label="Username" error={errors.username}>
                  <input
                    id="pf-username"
                    className={Style.input}
                    value={form.username}
                    onChange={(e) => setField("username", e.target.value)}
                    maxLength={30}
                    autoComplete="username"
                  />
                </Field>
                <Field id="pf-email" label="Email (cannot be changed)">
                  <input id="pf-email" className={Style.input} value={user.email || ""} disabled />
                </Field>
              </div>

              <Field id="pf-bio" label={`Bio (${form.bio.length}/500)`} error={errors.bio}>
                <textarea
                  id="pf-bio"
                  className={Style.textarea}
                  value={form.bio}
                  onChange={(e) => setField("bio", e.target.value)}
                  rows={4}
                  maxLength={500}
                />
              </Field>

              <h3 className={Style.groupTitle}>Current work</h3>
              <div className={Style.formGrid}>
                <Field id="pf-company" label="Company">
                  <input
                    id="pf-company"
                    className={Style.input}
                    value={form.currentwork.company}
                    onChange={(e) => setWorkField("company", e.target.value)}
                    maxLength={100}
                  />
                </Field>
                <Field id="pf-position" label="Position">
                  <input
                    id="pf-position"
                    className={Style.input}
                    value={form.currentwork.position}
                    onChange={(e) => setWorkField("position", e.target.value)}
                    maxLength={100}
                  />
                </Field>
                <Field id="pf-years" label="Years" error={errors.years}>
                  <input
                    id="pf-years"
                    type="number"
                    min="0"
                    max="60"
                    className={Style.input}
                    value={form.currentwork.years}
                    onChange={(e) => setWorkField("years", e.target.value)}
                  />
                </Field>
              </div>

              <h3 className={Style.groupTitle}>Past work</h3>
              {form.postwork.map((w, i) => (
                <div key={i} className={Style.rowGroup}>
                  <div className={Style.formGrid}>
                    <Field id={`pw-company-${i}`} label="Company">
                      <input
                        id={`pw-company-${i}`}
                        className={Style.input}
                        value={w.company}
                        onChange={(e) => setListItem("postwork", i, "company", e.target.value)}
                        maxLength={100}
                      />
                    </Field>
                    <Field id={`pw-position-${i}`} label="Position">
                      <input
                        id={`pw-position-${i}`}
                        className={Style.input}
                        value={w.position}
                        onChange={(e) => setListItem("postwork", i, "position", e.target.value)}
                        maxLength={100}
                      />
                    </Field>
                    <Field id={`pw-years-${i}`} label="Years">
                      <input
                        id={`pw-years-${i}`}
                        type="number"
                        min="0"
                        max="60"
                        className={Style.input}
                        value={w.years}
                        onChange={(e) => setListItem("postwork", i, "years", e.target.value)}
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    className={Style.removeBtn}
                    onClick={() => removeItem("postwork", i)}
                    aria-label={`Remove past job ${i + 1}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {form.postwork.length < MAX_ROWS && (
                <button type="button" className={Style.addBtn} onClick={() => addItem("postwork", blankWork)}>
                  + Add past job
                </button>
              )}

              <h3 className={Style.groupTitle}>Education</h3>
              {form.education.map((e, i) => (
                <div key={i} className={Style.rowGroup}>
                  <div className={Style.formGrid}>
                    <Field id={`ed-school-${i}`} label="School">
                      <input
                        id={`ed-school-${i}`}
                        className={Style.input}
                        value={e.school}
                        onChange={(ev) => setListItem("education", i, "school", ev.target.value)}
                        maxLength={100}
                      />
                    </Field>
                    <Field id={`ed-college-${i}`} label="College">
                      <input
                        id={`ed-college-${i}`}
                        className={Style.input}
                        value={e.college}
                        onChange={(ev) => setListItem("education", i, "college", ev.target.value)}
                        maxLength={100}
                      />
                    </Field>
                    <Field id={`ed-degree-${i}`} label="Degree">
                      <input
                        id={`ed-degree-${i}`}
                        className={Style.input}
                        value={e.degree}
                        onChange={(ev) => setListItem("education", i, "degree", ev.target.value)}
                        maxLength={100}
                      />
                    </Field>
                    <Field id={`ed-field-${i}`} label="Field of study">
                      <input
                        id={`ed-field-${i}`}
                        className={Style.input}
                        value={e.fieldOfStudy}
                        onChange={(ev) => setListItem("education", i, "fieldOfStudy", ev.target.value)}
                        maxLength={100}
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    className={Style.removeBtn}
                    onClick={() => removeItem("education", i)}
                    aria-label={`Remove education ${i + 1}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {form.education.length < MAX_ROWS && (
                <button type="button" className={Style.addBtn} onClick={() => addItem("education", blankEducation)}>
                  + Add education
                </button>
              )}

              <div className={Style.formActions}>
                <button type="button" className={Style.secondaryBtn} onClick={cancelEdit} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className={Style.primaryBtn} onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          )}

          {tab === "posts" && (
            <div className={Style.postsGrid}>
              {myPosts.length === 0 ? (
                <p className={Style.empty}>You haven&apos;t posted anything yet.</p>
              ) : (
                myPosts.map((post) => {
                  const media = Array.isArray(post.media) ? getImageUrl(post.media[0]) : null;
                  const likes = Array.isArray(post.likes) ? post.likes.length : Number(post.likes) || 0;
                  return (
                    <article key={post._id} className={Style.postCard}>
                      {media && (
                        <img
                          src={media}
                          alt=""
                          className={Style.postMedia}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <p className={Style.postBody}>{post.body}</p>
                      <div className={Style.postMeta}>
                        <span>
                          {likes} {likes === 1 ? "like" : "likes"}
                        </span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}
