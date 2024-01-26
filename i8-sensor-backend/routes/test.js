// // 출발지
// const lat1 = 35.206034;
// const lon1 = 129.078221;

// // 목적지
// const lat2 = 35.184753;
// const lon2 = 129.112072;

// // 위도, 경도를 라디안 단위로 변환
// const lat_1 = (lat1 * Math.PI) / 180;
// const lat_2 = (lat2 * Math.PI) / 180;
// const lon_1 = (lon1 * Math.PI) / 180;
// const lon_2 = (lon2 * Math.PI) / 180;

// const Bx = Math.cos(lat_2) * Math.cos(lon_2 - lon_1);
// const By = Math.cos(lat_2) * Math.sin(lon_2 - lon_1);
// const lat_3 = Math.atan2(
//   Math.sin(lat_1) + Math.sin(lat_2),
//   Math.sqrt(Math.pow(Math.cos(lat_1) + Bx, 2) + Math.pow(By, 2))
// );
// const lon_3 = lon_1 + Math.atan2(By, Math.cos(lat_1) + Bx);

// // 라디안을 디그리로 변환
// const lat3 = (lat_3 * 180) / Math.PI;
// let lon3 = (lon_3 * 180) / Math.PI;

// // 경도는 −180 ~ +180 사이의 값으로 정규화 할 수 있다.
// lon3 = ((lon3 + 540) % 360) - 180;

// console.log(lat3, lon3);

const turf = require("@turf/turf");

const coordinates = [
  [35.1469489874393, 129.032875047644],
  [35.1463727673706, 129.035472928618],
  [35.1534268620316, 129.033202133927],
  [35.1532332080052, 129.029827776357],
  [35.1535386858096, 129.032730355741],
  [35.1443184545334, 129.036309884005],
  [35.1520046917775, 129.029459305695],
  [35.1558739907577, 129.042819597165],
  [35.2253466830827, 129.089232550124],
  [37.4763155083213, 126.961871208632],
];

const points = turf.points(coordinates);
const center = turf.centerOfMass(points);
console.log(center.geometry.coordinates);
