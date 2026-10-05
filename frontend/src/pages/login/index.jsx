import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import UserLayout from "../../layout/userLayout";
import { useSelector, useDispatch } from 'react-redux'; 
import style from "./style.module.css";
import { loginUser, registerUser } from '@/config/redux/action/authAction';
import { emptyMessage } from '@/config/redux/reducer/authReducer';

export default function AuthPage() {
  const authState = useSelector((state) => state.auth);
  const [userloginmethod, setUserLoginMethod] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");

  const router = useRouter();
  const dispatch = useDispatch();

// Redirect on mount if token exists
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("token")) {
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    dispatch(emptyMessage());
  }, [userloginmethod, dispatch]);

  const handleLoginUser = async () => {
    const res = await dispatch(loginUser({ email, password }));
    const token = localStorage.getItem("token");
    if (registerUser.fulfilled.match(res) || token) {
      router.replace("/dashboard");
    }
  };

  const handleRegisterUser = async () => {
    // 1. Dispatch registration
    const regRes = await dispatch(registerUser({ username, name, email, password }));
    
    // 2. If registration succeeds, immediately dispatch login with the same credentials
    if (registerUser.fulfilled.match(regRes)) {
      const loginRes = await dispatch(loginUser({ email, password }));
      
      // 3. Now that login generated a token and fetched user data, redirect safely
      if (loginUser.fulfilled.match(loginRes)) {
        router.replace("/dashboard");
      }
    }
  };
    

  return (
    <UserLayout>
      <div className={style.mainContainer}>
        <div className={style.container}>
          <div className={style.cardLeft}>
            <p className={style.cardLeftText}>{userloginmethod ? "sign-in" : "sign-up"}</p>
            {authState.message && (
              <p className={style.errorMessage}>
                {typeof authState.message === "object" ? authState.message.text : authState.message}
              </p>
            )}
            <div className={style.inputContainers}>
              {!userloginmethod && (
                <div className={style.inputrow}>
                  <input
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    placeholder="username"
                    className={style.inputField}
                  />
                  <input
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    placeholder="name"
                    className={style.inputField}
                  />
                </div>
              )}
              <input
                onChange={(e) => setEmail(e.target.value)}
                type="text"
                placeholder="email"
                className={style.inputField}
              />
              <input
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="password"
                className={style.inputField}
              />
              <div className={style.btn}>
                <button
                  onClick={() => {
                    if (userloginmethod) {
                      handleLoginUser();
                    } else {
                      handleRegisterUser();
                    }
                  }}
                  className={style.btnOutline}
                >
                  {userloginmethod ? "sign-in" : "sign-up"}
                </button>
                <p>
                  {userloginmethod ? "New Here?" : "Already Have an Account?"}{" "}
                  <span
                    onClick={() => setUserLoginMethod(!userloginmethod)}
                    className={style.toggleText}
                  >
                    {userloginmethod ? "Sign Up" : "Sign In"}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className={style.cardRight}></div>
        </div>
      </div>
    </UserLayout>
  );
}