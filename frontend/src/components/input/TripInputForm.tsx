/**
 * @fileoverview 旅行情報入力フォームコンポーネント
 * @description 出発地・目的地・移動時間の入力と検索履歴表示を行い、経路計算ページへ遷移するフォーム
 * @author 尾﨑諒
 * @created 2025/07/03
 * @updated 2025/07/03
 * @version 1.0.0
 */


"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TripInputForm() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [time, setTime] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  // 履歴をlocalStorageから読み込む
  const loadSearchHistory = () => {
    try {
      const stored = localStorage.getItem("searchHistory");
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      } else {
        const defaultHistory = ['芝浦工業大学豊洲キャンパス', 'ららぽーと豊洲', '東京駅', '品川', '横浜', '川崎', '池袋', '上野'];
        setSearchHistory(defaultHistory);
      }
    } catch (error) {
      console.error("履歴の読み込みに失敗しました:", error);
      setSearchHistory([]);
    }
  };

  // 履歴をlocalStorageに保存
const saveSearchHistory = (fromValue: string, toValue: string) => {
  try {
    const current = JSON.parse(localStorage.getItem("searchHistory") || "[]");

    const candidates: string[] = [];
    if (fromValue !== "現在地") {
      candidates.push(fromValue);
    }
    if (toValue) {
      candidates.push(toValue);
    }

    const updated = Array.from(new Set([...candidates, ...current]));
    localStorage.setItem("searchHistory", JSON.stringify(updated.slice(0, 10)));
  } catch (error) {
    console.error("履歴の保存に失敗しました:", error);
  }
};

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const validateInputs = () => {
    const newErrors: Record<string, string> = {};
    if (!from.trim()) newErrors.from = "出発地を入力してください";
    if (!to.trim()) newErrors.to = "目的地を入力してください";
    if (!time.trim()) {
      newErrors.time = "移動時間を入力してください";
    } else if (!/^\d+$/.test(time.trim())) {
      if (/[０-９]/.test(time.trim())) {
        newErrors.time = `「${time.trim()}」は使用できません。時間は半角数字で入力してください（全角数字は使用できません）`;
      } else {
        newErrors.time = `「${time.trim()}」は使用できません。時間は半角数字のみで入力してください`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateInputs()) return;
    saveSearchHistory(from, to);
    // alert(`出発: ${from}, 目的地: ${to}, 時間: ${time}`);
    router.push(
      `/navigate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&time=${encodeURIComponent(time)}`
    );
  };

  const handleCurrentLocation = () => {
    setFrom("現在地");
    if (errors.from) {
      setErrors(prev => ({ ...prev, from: undefined }));
    }
  };

  const handleHistoryClick = (placeName: string) => {
    if (from === "") {
      setFrom(placeName);
      if (errors.from) setErrors(prev => ({ ...prev, from: undefined }));
    } else {
      setTo(placeName);
      if (errors.to) setErrors(prev => ({ ...prev, to: undefined }));
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTime(value);
    if (errors.time) setErrors(prev => ({ ...prev, time: undefined }));
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFrom(e.target.value);
    if (errors.from && e.target.value.trim()) {
      setErrors(prev => ({ ...prev, from: undefined }));
    }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTo(e.target.value);
    if (errors.to && e.target.value.trim()) {
      setErrors(prev => ({ ...prev, to: undefined }));
    }
  };

  // スタイル定義
  const containerStyle = { display: "flex", alignItems: "flex-start", justifyContent: "center", minHeight: "50vh", padding: "1rem" };
  const formStyle = { display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", width: "100%", maxWidth: "600px" };
  const inputContainerStyle = { position: "relative", width: "100%" };
  const inputWrapperStyle = { width: "100%", minHeight: "3.5rem" };
  const inputStyle = {
    width: "100%", padding: "0.8rem 1rem", border: "2px solid #9ca3af", borderRadius: "1.5rem", fontSize: "1rem",
    fontFamily: "Arial, Helvetica, sans-serif", backgroundColor: "white", outline: "none", transition: "all 0.2s", boxSizing: "border-box"
  };
  const inputErrorStyle = { ...inputStyle, border: "2px solid #ef4444" };
  const errorTextStyle = { color: "#ef4444", fontSize: "0.875rem", marginTop: "0.25rem", fontFamily: "Arial, Helvetica, sans-serif" };
  const currentLocationButtonStyle = {
    position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", backgroundColor: "#10b981", color: "white",
    border: "none", borderRadius: "1.2rem", padding: "0.4rem 0.8rem", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer",
    display: "flex", alignItems: "center", gap: "0.2rem", transition: "all 0.2s", fontFamily: "Arial, Helvetica, sans-serif"
  };
  const submitButtonStyle = {
    width: "160px", backgroundColor: "#065f46", color: "white", padding: "0.8rem 1.5rem", borderRadius: "1.5rem", fontSize: "0.9rem",
    fontWeight: "600", border: "none", cursor: "pointer", transition: "all 0.2s", fontFamily: "Arial, Helvetica, sans-serif", marginTop: "0.5rem"
  };
  const targetIconStyle = { width: "14px", height: "14px", fill: "currentColor" };
  const historyButtonStyle = {
    backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "0.5rem", padding: "0.75rem 1rem", fontSize: "0.875rem",
    cursor: "pointer", transition: "all 0.2s", fontFamily: "Arial, Helvetica, sans-serif", color: "#374151", width: "100%", textAlign: "left",
    marginBottom: "0.5rem"
  };
  const historyContainerStyle = { width: "100%", maxWidth: "600px", marginTop: "1rem", padding: "0 1rem" };
  const historyTitleStyle = { fontSize: "0.9rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem", fontFamily: "Arial, Helvetica, sans-serif" };
  const historyListStyle = { display: "flex", flexDirection: "column", width: "100%" };

  return (
    <div style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}>
      <div style={containerStyle}>
        <div style={formStyle}>
          {/* 出発地 */}
          <div style={inputWrapperStyle}>
            <div style={inputContainerStyle}>
              <input type="text" placeholder="出発地" value={from} onChange={handleFromChange} style={errors.from ? inputErrorStyle : inputStyle} />
              <button type="button" onClick={handleCurrentLocation} style={currentLocationButtonStyle}>
                <svg style={targetIconStyle} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                  <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" />
                </svg>
                現在地
              </button>
            </div>
            {errors.from && <div style={errorTextStyle}>{errors.from}</div>}
          </div>

          {/* 目的地 */}
          <div style={inputWrapperStyle}>
            <div style={inputContainerStyle}>
              <input type="text" placeholder="目的地" value={to} onChange={handleToChange} style={errors.to ? inputErrorStyle : inputStyle} />
            </div>
            {errors.to && <div style={errorTextStyle}>{errors.to}</div>}
          </div>

          {/* 移動時間 */}
          <div style={inputWrapperStyle}>
            <div style={inputContainerStyle}>
              <input type="text" placeholder="移動時間（分）" value={time} onChange={handleTimeChange} style={errors.time ? inputErrorStyle : inputStyle} />
            </div>
            {errors.time && <div style={errorTextStyle}>{errors.time}</div>}
          </div>

          {/* 送信ボタン */}
          <button onClick={handleSubmit} style={submitButtonStyle}>経路を計算</button>

          {/* 履歴 */}
          {searchHistory.length > 0 && (
            <div style={historyContainerStyle}>
              <div style={historyTitleStyle}>検索履歴</div>
              <div style={historyListStyle}>
                {searchHistory.slice(0, 5).map((place, i) => (
                  <button
                    key={i}
                    onClick={() => handleHistoryClick(place)}
                    style={historyButtonStyle}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                      e.currentTarget.style.borderColor = "#9ca3af";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = "white";
                      e.currentTarget.style.borderColor = "#d1d5db";
                    }}
                  >
                    {place}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
