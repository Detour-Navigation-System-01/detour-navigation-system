"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";


export default function TripInputForm() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [time, setTime] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);
  const [errors, setErrors] = useState({});
  const router = useRouter();


  // 検索履歴を読み込む関数
  const loadSearchHistory = async () => {
    try {
      // search_history.txtファイルを読み込み（アップロードされたファイル）
      const fileContent = await window.fs.readFile('search_history.txt', { encoding: 'utf8' });
      const historyLines = fileContent.split('\n').filter(line => line.trim() !== '');
      setSearchHistory(historyLines);
    } catch (error) {
      // ファイルが見つからない場合はサンプルデータを使用
      console.log('検索履歴ファイルが見つかりません。サンプルデータを使用します。');
      setSearchHistory(['芝浦工業大学豊洲キャンパス', 'ららぽーと豊洲', '東京駅', '品川', '横浜', '川崎', '池袋', '上野']);
    }
  };

  // コンポーネントマウント時に検索履歴を読み込み
  useEffect(() => {
    loadSearchHistory();
  }, []);

  // 入力値の検証
  const validateInputs = () => {
    const newErrors = {};

    // 出発地の検証
    if (!from.trim()) {
      newErrors.from = "出発地を入力してください";
    }

    // 目的地の検証
    if (!to.trim()) {
      newErrors.to = "目的地を入力してください";
    }

    // 時間の検証（半角数字のみ）
    if (time.trim() && !/^\d+$/.test(time.trim())) {
      // 全角数字が含まれているかチェック
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
    if (!validateInputs()) {
      return;
    }

    alert(`出発: ${from}, 目的地: ${to}, 時間: ${time}`);
    
    // クエリパラメータ付きで navigation ページへ遷移
    router.push(
      `/navigate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&time=${encodeURIComponent(time)}`
    );
  };

  const handleCurrentLocation = () => {
    setFrom("現在地");
    // エラーをクリア
    if (errors.from) {
      setErrors(prev => ({ ...prev, from: undefined }));
    }
  };

  // 履歴ボタンをクリックした時の処理
  const handleHistoryClick = (placeName) => {
    // 出発地が空の場合は出発地に、そうでなければ目的地に設定
    if (from === "") {
      setFrom(placeName);
      // エラーをクリア
      if (errors.from) {
        setErrors(prev => ({ ...prev, from: undefined }));
      }
    } else {
      setTo(placeName);
      // エラーをクリア
      if (errors.to) {
        setErrors(prev => ({ ...prev, to: undefined }));
      }
    }
  };

  // 時間入力の処理（すべての入力を受け付ける）
  const handleTimeChange = (e) => {
    const value = e.target.value;
    setTime(value);
    // エラーをクリア（入力中はエラーを表示しない）
    if (errors.time) {
      setErrors(prev => ({ ...prev, time: undefined }));
    }
  };

  // 出発地変更時のエラークリア
  const handleFromChange = (e) => {
    setFrom(e.target.value);
    if (errors.from && e.target.value.trim()) {
      setErrors(prev => ({ ...prev, from: undefined }));
    }
  };

  // 目的地変更時のエラークリア
  const handleToChange = (e) => {
    setTo(e.target.value);
    if (errors.to && e.target.value.trim()) {
      setErrors(prev => ({ ...prev, to: undefined }));
    }
  };

  const containerStyle = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    height: "auto",
    minHeight: "50vh",
    padding: "1rem",
  };

  const formStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
    width: "100%",
    maxWidth: "600px",
  };

  const inputContainerStyle = {
    position: "relative",
    width: "100%",
  };

  const inputWrapperStyle = {
    width: "100%",
    minHeight: "3.5rem", // エラーメッセージ分の高さを確保
  };

  const inputStyle = {
    width: "100%",
    padding: "0.8rem 1rem",
    border: "2px solid #9ca3af",
    borderRadius: "1.5rem",
    fontSize: "1rem",
    fontFamily: "Arial, Helvetica, sans-serif",
    backgroundColor: "white",
    outline: "none",
    transition: "all 0.2s ease-in-out",
    boxSizing: "border-box",
  };

  const inputErrorStyle = {
    ...inputStyle,
    border: "2px solid #ef4444",
  };

  const errorTextStyle = {
    color: "#ef4444",
    fontSize: "0.875rem",
    marginTop: "0.25rem",
    fontFamily: "Arial, Helvetica, sans-serif",
  };

  const currentLocationButtonStyle = {
    position: "absolute",
    right: "6px",
    top: "50%",
    transform: "translateY(-50%)",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "1.2rem",
    padding: "0.4rem 0.8rem",
    fontSize: "0.8rem",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.2rem",
    transition: "all 0.2s ease-in-out",
    fontFamily: "Arial, Helvetica, sans-serif",
  };

  const submitButtonStyle = {
    width: "160px",
    backgroundColor: "#065f46",
    color: "white",
    padding: "0.8rem 1.5rem",
    borderRadius: "1.5rem",
    fontSize: "0.9rem",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    fontFamily: "Arial, Helvetica, sans-serif",
    marginTop: "0.5rem",
  };

  const targetIconStyle = {
    width: "14px",
    height: "14px",
    fill: "currentColor",
  };

  const historyButtonStyle = {
    backgroundColor: "white",
    border: "1px solid #d1d5db",
    borderRadius: "0.5rem",
    padding: "0.75rem 1rem",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    fontFamily: "Arial, Helvetica, sans-serif",
    color: "#374151",
    width: "100%",
    textAlign: "left",
    marginBottom: "0.5rem",
  };

  const historyContainerStyle = {
    width: "100%",
    maxWidth: "600px",
    marginTop: "1rem",
    padding: "0 1rem",
  };

  const historyTitleStyle = {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "0.5rem",
    fontFamily: "Arial, Helvetica, sans-serif",
  };

  const historyListStyle = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  };

  return (
    <div style={{backgroundColor: "#f3f4f6", minHeight: "100vh"}}>
      <div style={containerStyle}>
        <div style={formStyle}>
          {/* 出発地 */}
          <div style={inputWrapperStyle}>
            <div style={inputContainerStyle}>
              <input
                type="text"
                placeholder="出発地"
                value={from}
                onChange={handleFromChange}
                style={errors.from ? inputErrorStyle : inputStyle}
              />
              <button
                type="button"
                onClick={handleCurrentLocation}
                style={currentLocationButtonStyle}
              >
                <svg style={targetIconStyle} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" fill="currentColor"/>
                  <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                現在地
              </button>
            </div>
            {errors.from && <div style={errorTextStyle}>{errors.from}</div>}
          </div>

          {/* 目的地 */}
          <div style={inputWrapperStyle}>
            <div style={inputContainerStyle}>
              <input
                type="text"
                placeholder="目的地"
                value={to}
                onChange={handleToChange}
                style={errors.to ? inputErrorStyle : inputStyle}
              />
            </div>
            {errors.to && <div style={errorTextStyle}>{errors.to}</div>}
          </div>

          {/* 移動時間 */}
          <div style={inputWrapperStyle}>
            <div style={inputContainerStyle}>
              <input
                type="text"
                placeholder="移動時間（分）"
                value={time}
                onChange={handleTimeChange}
                style={errors.time ? inputErrorStyle : inputStyle}
              />
            </div>
            {errors.time && <div style={errorTextStyle}>{errors.time}</div>}
          </div>

          {/* 送信ボタン */}
          <button onClick={handleSubmit} style={submitButtonStyle}>
            経路を計算
          </button>

          {/* 検索履歴 */}
          {searchHistory.length > 0 && (
            <div style={historyContainerStyle}>
              <div style={historyTitleStyle}>検索履歴</div>
              <div style={historyListStyle}>
                {searchHistory.slice(0, 5).map((placeName, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryClick(placeName)}
                    style={historyButtonStyle}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#f9fafb";
                      e.target.style.borderColor = "#9ca3af";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "white";
                      e.target.style.borderColor = "#d1d5db";
                    }}
                  >
                    {placeName}
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