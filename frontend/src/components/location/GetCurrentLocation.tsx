// /**
//  * @fileoverview 現在地取得コンポーネント
//  * @description ブラウザのジオロケーションAPIを使って現在地を取得し表示するコンポーネント
//  * @author 尾﨑諒
//  * @created 2025/07/03
//  * @updated 2025/07/03
//  * @version 1.0.0
//  */

// "use client";

// import { useState } from "react";

// export default function GetCurrentLocation() {
//   const [position, setPosition] = useState<GeolocationCoordinates | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   const getLocation = () => {
//     if (!navigator.geolocation) {
//       setError("このブラウザでは位置情報が利用できません。");
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       (pos) => {
//         setPosition(pos.coords);
//         setError(null);
//       },
//       (err) => {
//         setError("位置情報の取得に失敗しました: " + err.message);
//       }
//     );
//   };

//   return (
//     <div className="p-4">
//       <button onClick={getLocation} className="bg-green-600 text-white px-4 py-2 rounded">
//         現在地を取得
//       </button>

//       {position && (
//         <div className="mt-4">
//           <p>緯度: {position.latitude}</p>
//           <p>経度: {position.longitude}</p>
//         </div>
//       )}

//       {error && <p className="text-red-500 mt-2">{error}</p>}
//     </div>
//   );
// }
