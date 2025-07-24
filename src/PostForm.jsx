import React, { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export default function PostForm({ user, onPostCreated, selectedCategory }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(selectedCategory || "자유 게시판");
  const [loading, setLoading] = useState(false);

  const categories = ["공지", "자유 게시판", "연구원이 묻습니다", "모임 사진", "성소수자 관련 소식"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "posts"), {
        title,
        content,
        category,
        author: user.displayName,
        uid: user.uid,
        createdAt: Timestamp.now(),
      });
      setTitle("");
      setContent("");
      if (onPostCreated) onPostCreated();
      alert("게시글이 성공적으로 등록되었습니다!");
    } catch (e) {
      alert("글 등록 실패: " + e.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{
      fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* 카테고리 선택 */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{
          display: "block",
          fontSize: "14px",
          fontWeight: 600,
          color: "#262626",
          marginBottom: "8px",
          letterSpacing: "-0.84px"
        }}>
          카테고리
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: "1px solid #E0E0E0",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#262626",
            backgroundColor: "#fff",
            letterSpacing: "-0.84px",
            outline: "none"
          }}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* 제목 입력 */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{
          display: "block",
          fontSize: "14px",
          fontWeight: 600,
          color: "#262626",
          marginBottom: "8px",
          letterSpacing: "-0.84px"
        }}>
          제목
        </label>
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: "1px solid #E0E0E0",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#262626",
            backgroundColor: "#fff",
            letterSpacing: "-0.84px",
            outline: "none",
            boxSizing: "border-box"
          }}
        />
      </div>

      {/* 내용 입력 */}
      <div style={{ marginBottom: "30px" }}>
        <label style={{
          display: "block",
          fontSize: "14px",
          fontWeight: 600,
          color: "#262626",
          marginBottom: "8px",
          letterSpacing: "-0.84px"
        }}>
          내용
        </label>
        <textarea
          placeholder="내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
          rows={8}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: "1px solid #E0E0E0",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 400,
            color: "#262626",
            backgroundColor: "#fff",
            letterSpacing: "-0.84px",
            lineHeight: "1.5",
            outline: "none",
            resize: "vertical",
            boxSizing: "border-box",
            fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
          }}
        />
      </div>

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          border: "none",
          borderRadius: "12px",
          backgroundColor: loading ? "#CCCCCC" : "#6860FF",
          color: "#fff",
          fontSize: "16px",
          fontWeight: 700,
          letterSpacing: "-0.96px",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background-color 0.2s"
        }}
      >
        {loading ? "등록 중..." : "게시글 등록"}
      </button>
    </form>
  );
} 