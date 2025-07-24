import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import PostForm from "./PostForm";

export default function CommunityBoard({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("자유 게시판");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPostForm, setShowPostForm] = useState(false);

  const categories = [
    { name: "공지", active: false },
    { name: "자유 게시판", active: true }
  ];

  const subCategories = [
    { name: "연구원이 묻습니다", active: false },
    { name: "모임 사진", active: false },
    { name: "성소수자 관련 소식", active: false }
  ];

  const fetchPosts = () => {
    setLoading(true);
    let q;
    
    if (selectedCategory === "공지") {
      q = query(
        collection(db, "posts"), 
        where("category", "==", "공지"),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    }

    return onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        isPopular: Math.random() > 0.7 // 임시로 인기글 랜덤 설정
      }));
      setPosts(postsData);
      setLoading(false);
    });
  };

  useEffect(() => {
    const unsubscribe = fetchPosts();
    return () => unsubscribe();
  }, [selectedCategory]);

  const formatTimeAgo = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return "";
    const now = new Date();
    const postTime = timestamp.toDate();
    const diffInMinutes = Math.floor((now - postTime) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}일 전`;
  };

  const getRandomStats = () => ({
    comments: Math.floor(Math.random() * 100),
    likes: Math.floor(Math.random() * 1000)
  });

  return (
    <div style={{
      fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif",
      backgroundColor: "#fff",
      minHeight: "100vh",
      maxWidth: "393px",
      margin: "0 auto",
      position: "relative"
    }}>
      {/* 헤더 */}
      <header style={{
        padding: "35px 36px 0",
        marginBottom: "20px"
      }}>
        <h1 style={{
          fontFamily: "Lexend, sans-serif",
          fontSize: "26.65px",
          fontWeight: 800,
          color: "#3C3A3A",
          margin: "0 0 20px 0",
          letterSpacing: "-1.066px",
          lineHeight: "42.87px"
        }}>
          2p Lab.
        </h1>

        {/* 네비게이션 메뉴 */}
        <nav style={{
          display: "flex",
          gap: "29px",
          marginBottom: "47px"
        }}>
          <span style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#575454",
            letterSpacing: "-0.96px",
            lineHeight: "25.74px"
          }}>인트로</span>
          <span style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#575454",
            letterSpacing: "-0.96px",
            lineHeight: "25.74px"
          }}>운영 정책(규칙)</span>
          <span style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#575454",
            letterSpacing: "-0.96px",
            lineHeight: "25.74px"
          }}>크루</span>
          <span style={{
            fontSize: "16px",
            fontWeight: 900,
            color: "#6860FF",
            letterSpacing: "-0.96px",
            lineHeight: "25.74px"
          }}>커뮤니티</span>
        </nav>

        {/* 카테고리 탭 첫 번째 줄 */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px"
        }}>
          <div style={{ display: "flex", gap: "12px" }}>
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                style={{
                  padding: "6.5px 11px",
                  borderRadius: "12px",
                  border: "none",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  letterSpacing: "-0.81px",
                  cursor: "pointer",
                  backgroundColor: selectedCategory === category.name ? "#6860FF" : "#F3F2F8",
                  color: selectedCategory === category.name ? "#fff" : "#6860FF"
                }}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* 글쓰기 버튼 */}
          <button
            onClick={() => setShowPostForm(!showPostForm)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "7.5px 11px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "#FF8867",
              color: "#fff",
              fontSize: "13.5px",
              fontWeight: 700,
              letterSpacing: "-0.81px",
              cursor: "pointer"
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M6.15 2.917V11.083" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
              <path d="M2.917 6.15H11.083" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
            글쓰기
          </button>
        </div>

        {/* 카테고리 탭 두 번째 줄 */}
        <div style={{
          display: "flex",
          gap: "9.5px",
          marginBottom: "28px"
        }}>
          {subCategories.map((category) => (
            <button
              key={category.name}
              onClick={() => setSelectedSubCategory(
                selectedSubCategory === category.name ? "" : category.name
              )}
              style={{
                padding: "6.5px 11px",
                borderRadius: "12px",
                border: "none",
                fontSize: "13.5px",
                fontWeight: 700,
                letterSpacing: "-0.81px",
                cursor: "pointer",
                backgroundColor: selectedSubCategory === category.name ? "#6860FF" : "#F3F2F8",
                color: selectedSubCategory === category.name ? "#fff" : "#6860FF"
              }}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* 검색 영역 */}
        <div style={{ marginBottom: "25px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            paddingBottom: "8px",
            borderBottom: "1.7px solid #6860FF"
          }}>
            <input
              type="text"
              placeholder="검색어를 입력하세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "16px",
                fontWeight: 600,
                color: searchQuery ? "#6860FF" : "#A3A1A0",
                backgroundColor: "transparent",
                letterSpacing: "-0.96px",
                lineHeight: "24.71px"
              }}
            />
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="9.17" cy="9.17" r="5.67" stroke="#6860FF" strokeWidth="2"/>
              <path d="m16.5 16.5-3.12-3.12" stroke="#6860FF" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          {/* 검색 결과 없음 메시지 */}
          {searchQuery && posts.length === 0 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              padding: "20px 16px",
              color: "#A3A1A0",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "-0.72px",
              lineHeight: "18.53px"
            }}>
              <div style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#A3A1A0",
                borderRadius: "50%"
              }}></div>
              일치하는 검색 결과가 존재하지 않아 다른 게시글을 보여 드릴게요
            </div>
          )}
        </div>
      </header>

      {/* 글쓰기 폼 */}
      {showPostForm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "393px",
          height: "100vh",
          backgroundColor: "white",
          zIndex: 1000,
          padding: "20px 32px",
          overflowY: "auto"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px"
          }}>
            <h2 style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#262626",
              margin: 0
            }}>글쓰기</h2>
            <button
              onClick={() => setShowPostForm(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#666"
              }}
            >
              ×
            </button>
          </div>
          <PostForm 
            user={user} 
            onPostCreated={() => {
              setShowPostForm(false);
              fetchPosts();
            }}
            selectedCategory={selectedCategory}
          />
        </div>
      )}

      {/* 게시글 목록 */}
      <main style={{ padding: "0 32px", paddingBottom: "50px" }}>
        {loading ? (
          <div style={{
            textAlign: "center",
            padding: "50px",
            color: "#A3A1A0",
            fontSize: "14px"
          }}>
            불러오는 중...
          </div>
        ) : (
          <div>
            {posts.map((post, index) => {
              const stats = getRandomStats();
              return (
                <article
                  key={post.id}
                  style={{
                    marginBottom: "16px",
                    paddingBottom: "16px",
                    borderBottom: index === posts.length - 1 ? "none" : "0.65px solid #CFCFCF"
                  }}
                >
                  {/* 태그 영역 */}
                  <div style={{
                    display: "flex",
                    gap: "7px",
                    marginBottom: "13px"
                  }}>
                    {post.isPopular && (
                      <span style={{
                        padding: "2px 6px",
                        borderRadius: "3px",
                        backgroundColor: "#FFEDE3",
                        color: "#FF5D18",
                        fontSize: "8px",
                        fontWeight: 800,
                        letterSpacing: "-0.48px",
                        lineHeight: "12.35px"
                      }}>
                        인기글
                      </span>
                    )}
                    <span style={{
                      padding: "2px 6px",
                      borderRadius: "3px",
                      backgroundColor: "#F0F0F0",
                      color: "#A3A1A0",
                      fontSize: "8px",
                      fontWeight: 800,
                      letterSpacing: "-0.48px",
                      lineHeight: "12.35px"
                    }}>
                      일반 태그
                    </span>
                  </div>

                  {/* 게시글 내용 */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px"
                  }}>
                    <div style={{ flex: 1, marginRight: "20px" }}>
                      <h3 style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#262626",
                        lineHeight: "21.62px",
                        letterSpacing: "-0.84px",
                        margin: "0 0 10px 0",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                        overflow: "hidden"
                      }}>
                        {post.title}
                      </h3>
                      
                      {post.content && (
                        <p style={{
                          fontSize: "11px",
                          fontWeight: 400,
                          color: "#000",
                          lineHeight: "16.99px",
                          letterSpacing: "-0.66px",
                          margin: 0,
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 1,
                          overflow: "hidden"
                        }}>
                          {post.content}
                        </p>
                      )}
                    </div>

                    {/* 썸네일 (20% 확률로 표시) */}
                    {Math.random() > 0.8 && (
                      <div style={{
                        width: "52px",
                        height: "52px",
                        backgroundColor: "rgba(207, 207, 207, 0.2)",
                        borderRadius: "10px",
                        flexShrink: 0
                      }}></div>
                    )}
                  </div>

                  {/* 하단 정보 */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    {/* 작성자 정보 */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px"
                    }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                      }}>
                        <div style={{
                          width: "14px",
                          height: "14px",
                          backgroundColor: "#ddd",
                          borderRadius: "50%"
                        }}></div>
                        <span style={{
                          fontSize: "9px",
                          fontWeight: 600,
                          color: "#000",
                          letterSpacing: "-0.54px",
                          lineHeight: "13.9px"
                        }}>
                          {post.author || "민호"}
                        </span>
                      </div>
                      <span style={{
                        fontSize: "9px",
                        fontWeight: 500,
                        color: "#C3BBBB",
                        letterSpacing: "-0.54px",
                        lineHeight: "13.9px"
                      }}>
                        {formatTimeAgo(post.createdAt)}
                      </span>
                    </div>

                    {/* 반응 정보 */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "15px"
                    }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "9px"
                      }}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <circle cx="6.5" cy="6.5" r="4.875" stroke="#9F9F9F" strokeWidth="1.2"/>
                          <path d="m4.875 8.125 3.25-3.25" stroke="#9F9F9F" strokeWidth="1.2"/>
                        </svg>
                        <span style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "#9F9F9F",
                          letterSpacing: "-0.6px",
                          lineHeight: "15.44px"
                        }}>
                          {stats.comments}
                        </span>
                      </div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "9px"
                      }}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M6.5 2.167c-1.434 0-2.708.758-3.417 1.983-.708-1.225-1.983-1.983-3.416-1.983C-1.25 2.167-2.167 3.583-2.167 5.417c0 2.708 4.334 6.5 8.667 6.5s8.667-3.792 8.667-6.5c0-1.834-.917-3.25-1.834-3.25z" stroke="#9F9F9F" strokeWidth="1.2"/>
                        </svg>
                        <span style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "#9F9F9F",
                          letterSpacing: "-0.6px",
                          lineHeight: "15.44px"
                        }}>
                          {stats.likes}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
} 