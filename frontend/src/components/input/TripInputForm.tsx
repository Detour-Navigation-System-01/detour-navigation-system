"use client";

import { useState } from "react";

export default function TripInputForm() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [time, setTime] = useState("");

  const handleCurrentLocation = () => {
    setFrom("現在地");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`出発: ${from}, 目的地: ${to}, 時間: ${time}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md flex flex-col gap-5"
      >
        {/* 出発地 */}
        <div className="flex flex-col gap-2 w-full">
          <div className="flex gap-2 w-full">
            <input
              type="text"
              placeholder="出発地"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-4 py-4 border border-gray-300 rounded-lg shadow-sm text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="button"
              onClick={handleCurrentLocation}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
            >
              現在地
            </button>
          </div>
        </div>

        {/* 目的地 */}
        <input
          type="text"
          placeholder="目的地"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full px-4 py-4 border border-gray-300 rounded-lg shadow-sm text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        {/* 時間 */}
        <input
          type="text"
          placeholder="時間（例：930）"
          value={time}
          onChange={(e) => setTime(e.target.value.replace(/[^0-9]/g, ""))}
          inputMode="numeric"
          maxLength={4}
          pattern="\d+"
          className="w-full px-4 py-4 border border-gray-300 rounded-lg shadow-sm text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        {/* ボタン */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg text-base font-semibold hover:bg-blue-700 transition active:scale-95"
        >
          経路を計算
        </button>
      </form>
    </div>
  );
}
