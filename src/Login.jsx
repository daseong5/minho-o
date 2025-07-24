import React from "react";
import { auth } from "./firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

export default function Login({ user }) {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      alert("로그인 실패: " + e.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      alert("로그아웃 실패: " + e.message);
    }
  };

  if (user) {
    return (
      <div style={{
        position: "fixed",
        top: "20px",
        right: "32px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        backgroundColor: "#F3F2F8",
        padding: "8px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: 600,
        color: "#6860FF",
        zIndex: 100
      }}>
        <div style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: "#6860FF",
          backgroundImage: user.photoURL ? `url(${user.photoURL})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}></div>
        <span>{user.displayName}</span>
        <button
          onClick={handleLogout}
          style={{
            background: "none",
            border: "none",
            color: "#6860FF",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "underline"
          }}
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "#fff",
        padding: "40px 32px",
        borderRadius: "16px",
        textAlign: "center",
        maxWidth: "320px",
        margin: "20px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)"
      }}>
        <h2 style={{
          fontSize: "20px",
          fontWeight: 700,
          color: "#262626",
          marginBottom: "16px",
          letterSpacing: "-1.2px"
        }}>
          로그인이 필요합니다
        </h2>
        <p style={{
          fontSize: "14px",
          fontWeight: 400,
          color: "#666",
          marginBottom: "32px",
          lineHeight: "1.5",
          letterSpacing: "-0.84px"
        }}>
          커뮤니티를 이용하려면<br />
          Google 계정으로 로그인해 주세요
        </p>
        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "14px 20px",
            border: "1px solid #E0E0E0",
            borderRadius: "12px",
            backgroundColor: "#fff",
            color: "#262626",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            letterSpacing: "-0.96px",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#F8F8F8";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#fff";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Google로 로그인
        </button>
      </div>
    </div>
  );
} 