// import { Box, Card } from '@mui/material'
// import { useEffect, useRef, useState } from 'react'
// import { DeviceFilteredListState, DeviceListState, MapLevelState } from '../state'
// import { useRecoilState } from 'recoil'
// import { Device } from './interface/Device'
// import { set } from 'nprogress'

// export default function Map({ device, list }) {
//   const mapContainer = useRef(null)
//   const [map, setMap] = useState<any>(null)
//   const [geocoder, setGeocoder] = useState<any>(null)
//   const [mapLevel, setMapLevel] = useRecoilState(MapLevelState)

//   const [addressList, setAddressList] = useState([])

//   useEffect(() => {
//     const kakaoMapScript = document.createElement('script')
//     kakaoMapScript.async = false
//     kakaoMapScript.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAOMAP_API}&autoload=false&libraries=services,clusterer`

//     document.head.appendChild(kakaoMapScript)

//     const onLoadKakaoAPI = () => {
//       window.kakao.maps.load(() => {
//         const mapOption = {
//           center: new window.kakao.maps.LatLng(36.5, 127.5),
//           level: 13
//         }

//         const geocoder = new window.kakao.maps.services.Geocoder()
//         setGeocoder(geocoder)

//         const map = new window.kakao.maps.Map(mapContainer.current, mapOption)

//         // 지도 확대 축소를 제어할 수 있는  줌 컨트롤을 생성합니다
//         const zoomControl = new window.kakao.maps.ZoomControl()
//         map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT)

//         // 지도 레벨 변경 event listener
//         // window.kakao.maps.event.addListener(map, 'zoom_changed', function () {
//         //   const level = map.getLevel()
//         //   setMapLevel(level)
//         // })

//         // 마커 이미지의 생성
//         const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png'
//         const imageSize = new window.kakao.maps.Size(24, 35)
//         const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize)

//         //지도 움직이거나 줌인해서 로딩이 끝났을 때 일어나는 리스너
//         window.kakao.maps.event.addListener(map, 'tilesloaded', function () {
//           //지도 레벨 업데이트
//           const level = map.getLevel()
//           setMapLevel(level)

//           //지도가 주소를 포함했는지 판단
//           const bounds = map.getBounds()

//           const List: any = []

//           //마커 그리기
//           device.map((el: Device) => {
//             geocoder.addressSearch(el.address, (result: any, status: any) => {
//               if (status === window.kakao.maps.services.Status.OK) {
//                 const marker = new window.kakao.maps.Marker({
//                   map: map, // 마커를 표시할 지도
//                   position: new window.kakao.maps.LatLng(result[0].y, result[0].x), // 마커를 표시할 위치
//                   title: el.address, // 마커의 타이틀, 마커에 마우스를 올리면 타이틀이 표시됩니다
//                   image: markerImage // 마커 이미지
//                 })
//               }

//               //마커가 지도에 포함되어있는지 확인
//               if (bounds.contain(new window.kakao.maps.LatLng(result[0].y, result[0].x))) {
//                 // console.log(el.address)
//                 List.push(el)
//               }
//             })
//           })

//           setAddressList(List)

//           //구분선
//         })
//       })
//     }

//     kakaoMapScript.addEventListener('load', onLoadKakaoAPI)
//   }, [device, setMapLevel, setAddressList])

//   console.log(addressList)

//   return (
//     <>
//       <Box
//         id='map'
//         ref={mapContainer}
//         sx={{ width: '100%', height: '700px', minWidth: '400px', fontSize: '5px' }}
//       ></Box>
//     </>
//   )
// }
