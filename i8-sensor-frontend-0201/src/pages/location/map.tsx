// import axios from 'axios'
// import React, { useEffect, useState, useRef } from 'react'
// import * as turf from '@turf/turf'
// import 'tailwindcss/tailwind.css'

// export default function Map_({
//   root,
//   setRoot,
//   nodeArrayAtDepth,
//   rootCopy,
//   addressDetail,
//   selectedCircleName,
//   setSelectedCircleName
// }) {
//   const mapContainer = useRef(null)

//   // 지도 레벨에 따른 클러스터링
//   const [map, setMap] = useState<any>(null)
//   const [geocoder, setGeocoder] = useState<any>(null)
//   const [mapLevel, setMapLevel] = useState<number>(14)

//   // 클러스터링 원, 커스텀 오버레이 배열 (초기화용)
//   const [clusterCircleArray, setClusterCircleArray] = useState<any>([])
//   const [customOverlayArray, setCustomOverlayArray] = useState<any>([])

//   // node depth
//   const [depth_, setDepth] = useState<number>(1)
//   const [currentDepth, setCurrentDepth] = useState<number>(-1)

//   const [containIndex, setContainIndex] = useState<number>(0)

//   // 단말 데이터 받아오기
//   const getDeviceInfo = async () => {
//     await axios
//       .get('/api/device', {
//         withCredentials: true
//       })
//       .then(async response => {
//         let res = response.data
//         if (res.status === 'success') {
//         } else {
//           console.log('fail')
//         }
//       })
//   }

//   // map 관련 useEffect
//   useEffect(() => {
//     const kakaoMapScript = document.createElement('script')
//     kakaoMapScript.async = false
//     kakaoMapScript.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAOMAP_API}&autoload=false&libraries=services,clusterer`
//     document.head.appendChild(kakaoMapScript)

//     const onLoadKakaoAPI = async () => {
//       if (!mapContainer.current) return

//       await window.kakao.maps.load(async () => {
//         await getDeviceInfo()

//         const mapOption = {
//           center: new window.kakao.maps.LatLng(36.5, 127.5),
//           level: 13
//         }

//         const geocoder = await new window.kakao.maps.services.Geocoder()
//         setGeocoder(geocoder)

//         const map = new window.kakao.maps.Map(mapContainer.current, mapOption)
//         setMap(map)

//         // 지도 레벨 변경 event listener
//         window.kakao.maps.event.addListener(map, 'zoom_changed', function () {
//           var level = map.getLevel()
//           setMapLevel(level)
//           // console.log(level)
//         })
//       })
//     }
//     kakaoMapScript.addEventListener('load', onLoadKakaoAPI)
//   }, [])

//   // center change
//   useEffect(() => {
//     if (!map) return

//     new Promise(resolve => {
//       geocoder.addressSearch(addressDetail, (result, status) => {
//         resolve({ result, status })
//       })
//     }).then(result => {
//       if (result.status === window.kakao.maps.services.Status.OK) {
//         const coords = new window.kakao.maps.LatLng(result.result[0].y, result.result[0].x)

//         map.panTo(coords)
//       }
//     })
//   }, [addressDetail])

//   // 기존에 그려져있던 클러스터링 원, 커스텀 오버레이 삭제
//   async function removeOverlay() {
//     // console.log("remove start")
//     // console.log(clusterCircleArray)

//     for (const circle of clusterCircleArray) {
//       // console.log("remove")
//       if (circle) await circle.setMap(null)
//     }

//     for (const customOverlay of customOverlayArray) {
//       if (customOverlay) await customOverlay.setMap(null)
//     }
//   }

//   // 클러스터링 관련 useEffect
//   useEffect(() => {
//     if (!map) return
//     console.log('%cSTART', 'background: red; color: white;')

//     let circleColor: string = ''
//     let circleRadius: number = 0
//     let fontSize: string = ''

//     async function boundsCoordinateContain(node: ClusterNode, address: string, index: number) {
//       let resultIndex = 0

//       if (!node.coordinate) {
//         // console.log("set")

//         await new Promise(resolve => {
//           geocoder?.addressSearch(address, (result: any, status: any) => {
//             resolve({ result, status })
//           })
//         }).then(async (result: any) => {
//           if (result.status === window.kakao.maps.services.Status.OK) {
//             const coords = new window.kakao.maps.LatLng(result.result[0].y, result.result[0].x)

//             rootCopy.findAndUpdateCoordinate(node.name, coords, rootCopy)
//             const bounds = map.getBounds()

//             if (bounds.contain(coords)) {
//               // console.log(`${node.name} 발견!`)
//               resultIndex = index
//             } else {
//               return false
//             }
//           }
//         })
//       } else {
//         const bounds = map.getBounds()

//         if (bounds.contain(node.coordinate)) {
//           // console.log(`${node.name} 발견!`)
//           resultIndex = index
//         } else {
//           return false
//         }
//       }

//       return resultIndex
//     }

//     async function updateByDepth(depth: number) {
//       const nodesAtDepth = rootCopy.getAllNodesAtDepth(rootCopy, depth)

//       if (JSON.stringify(nodeArrayAtDepth) !== JSON.stringify(nodesAtDepth)) {
//         // setNodeArrayAtDepth(nodesAtDepth)
//       }

//       // console.log(nodesAtDepth)
//       // console.log(`containIndex : ${containIndex}`)
//       // console.log(`containIndex name : ${nodesAtDepth[containIndex].name}`)
//       await removeOverlay()
//       const parentNodeAtDepth = rootCopy.findParentNodeContainingNode(nodesAtDepth[containIndex], rootCopy)

//       /* root -> 부산, 서울 (2개) -> 2번 반복하며 각 요소의 children 길이 구하기
//             -> 각 children 반복하며 각 좌표 배열 생성 -> 각 좌표 배열의 중점 좌표 구해서 클러스터링 원 */
//       // console.log(`root name : ${parentNodeAtDepth.name}`);
//       return parentNodeAtDepth
//     }

//     async function createCluster(parentNodeAtDepth: ClusterNode) {
//       let clusterObject = {}
//       let tempClusterCircleArray: any = []
//       let tempCustomOverlayArray: any = []

//       // 단말 개수에 따라 0.5 ~ 1 사이의 값으로 정규화하여 배열 반환 (min-max scaling)
//       function minMaxScaling(inputArray: Array<number>) {
//         if (inputArray.length === 1) return [1]
//         const minValue = Math.min(...inputArray)
//         const maxValue = Math.max(...inputArray)

//         const newMin = 0.5
//         const newMax = 1

//         const scaledArray = inputArray.map((value: number) => {
//           return ((newMax - newMin) * (value - minValue)) / (maxValue - minValue) + newMin
//         })

//         return scaledArray
//       }

//       if (!parentNodeAtDepth) return
//       if (!parentNodeAtDepth.hasOwnProperty('children')) return

//       let scaling_array: Array<number> = []

//       // 각 클러스터링 원의 반지름에 할당할 scale 배열을 만듬
//       for (const node of parentNodeAtDepth.children) {
//         const nodeName: string = node.name
//         clusterObject[nodeName] = node.findLowestNodes()
//         scaling_array.push(clusterObject[nodeName].length)
//       }

//       let scaled_array = minMaxScaling(scaling_array)

//       let index = 0

//       // 현재 root의 children을 순회하며 각 요소의 최하위 노드 배열을 가져옴
//       for (const node of parentNodeAtDepth.children) {
//         // parentNodeAtDepth.children.forEach(async function (node, index) {
//         if (node.name !== null) clusterObject[node.name] = node.findLowestNodes()
//         // console.log(`${node.name} 클러스터링 원 그리기`);

//         let coordinates: Array<Array<number>> = []

//         // 최하위 노드 배열의 주소를 좌표로 변환하여 배열 생성
//         for (const nodeItem of clusterObject[node.name]) {
//           await new Promise(resolve => {
//             geocoder.addressSearch(nodeItem.addressData, (result: any, status: any) => {
//               resolve({ result, status })
//             })
//           }).then((result: any) => {
//             if (result.status === window.kakao.maps.services.Status.OK) {
//               const coords = new window.kakao.maps.LatLng(result.result[0].y, result.result[0].x)

//               const temp_coordinate = [coords.getLat(), coords.getLng()]
//               coordinates.push(temp_coordinate)
//             }
//           })
//         }

//         // 최하위 노드 좌표 배열을 이용하여 중점 좌표를 구함
//         if (!coordinates.length) return

//         const points = turf.points(coordinates)
//         const center = turf.centerOfMass(points)

//         // 중점 좌표를 이용하여 클러스터링 원 생성
//         let circle = await new window.kakao.maps.Circle({
//           // 중심 좌표
//           center: await new window.kakao.maps.LatLng(center.geometry.coordinates[0], center.geometry.coordinates[1]),
//           radius: circleRadius * scaled_array[index], // 미터 단위의 원의 반지름
//           strokeWeight: 2, // 선의 두께
//           strokeColor: '#BD3728', // 선의 색깔
//           strokeOpacity: node.name === selectedCircleName ? 1 : 0, // 선의 불투명도, 0에 가까울수록 투명
//           strokeStyle: 'longdash', // 선의 스타일
//           fillColor: circleColor, // 채우기 색깔
//           fillOpacity: 0.7 // 채우기 불투명도
//         })

//         await window.kakao.maps.event.addListener(circle, 'click', function () {
//           setSelectedCircleName(node.name)
//         })

//         // 원에 마우스를 올리면 pointer cursor로 변경
//         await window.kakao.maps.event.addListener(circle, 'mouseover', function () {
//           map.setCursor('pointer')
//           circle.setOptions({ fillOpacity: 0.8 })
//         })

//         // 마우스가 원을 벗어나면 default cursor로 변경 (손 모양)
//         await window.kakao.maps.event.addListener(circle, 'mouseout', function () {
//           map.setCursor('')
//           circle.setOptions({ fillOpacity: 0.7 })
//         })

//         // 클러스터 오버레이 (현재 클러스터에 포함된 단말 개수 출력)
//         let customOverlay = new window.kakao.maps.CustomOverlay({
//           position: await new window.kakao.maps.LatLng(center.geometry.coordinates[0], center.geometry.coordinates[1]),
//           content: `
//                                 <div class ="hover:cursor-pointer"}">
//                                     <span class="left"></span>
//                                         <span class="center ${fontSize} text-white font-bold drop-shadow-2xl transition">
//                                             ${coordinates.length}
//                                         </span>
//                                     <span class="right"></span>
//                                 </div>
//                             `
//         })

//         await window.kakao.maps.event.addListener(customOverlay, 'click', function () {
//           setSelectedCircleName(node.name)
//         })

//         if (depth_ === currentDepth) {
//           // console.log(tempClusterCircleArray)

//           tempClusterCircleArray.push(circle)
//           tempCustomOverlayArray.push(customOverlay)
//           await circle.setMap(map)
//           await customOverlay.setMap(map)
//         }

//         index++
//       }

//       setClusterCircleArray(tempClusterCircleArray)
//       setCustomOverlayArray(tempCustomOverlayArray)
//     }

//     let parentNodeAtDepth: ClusterNode
//     // console.log(`depth: ${depth_}`)

//     async function main() {
//       await removeOverlay()
//       let eventListenerTemp

//       // depth에 따라 event listener를 부여함
//       async function addEventListenerByDepth(depth: number) {
//         eventListenerTemp = await window.kakao.maps.event.addListener(map, 'dragend', async () => {
//           const nodesAtDepth = rootCopy.getAllNodesAtDepth(rootCopy, depth)

//           let index = 0

//           for (const node of nodesAtDepth) {
//             const result = await boundsCoordinateContain(node, node.addressData, index)

//             if (result) {
//               if (containIndex !== result) {
//                 // console.log("contain index changed")
//                 // console.log(nodesAtDepth[result])
//                 // console.log(root.findParentNodeContainingNode(nodesAtDepth[result], root))
//                 // console.log(`❤ result: ${result}`)
//                 // console.log(clusterCircleArray);

//                 await setContainIndex(prev => {
//                   if (prev !== result) {
//                     return result
//                   } else {
//                     return prev
//                   }
//                 })

//                 return
//               }
//             }

//             index++
//           }
//         })
//         await window.kakao.maps.event.removeListener(map, 'dragend', eventListenerTemp)
//       }

//       // 현재 지도 확대 레벨에 따라 depth state를 변경
//       if (mapLevel >= 10 && mapLevel <= 14) {
//         window.kakao.maps.event.removeListener(map, 'dragend', eventListenerTemp)
//         parentNodeAtDepth = await updateByDepth(1)
//         await addEventListenerByDepth(1)
//         setCurrentDepth(depth_)
//         setDepth(prev => 1)
//         circleColor = '#F28080'
//         circleRadius = 3000 * mapLevel
//         fontSize = 'text-xl'
//       } else if (mapLevel >= 7 && mapLevel <= 9) {
//         window.kakao.maps.event.removeListener(map, 'dragend', eventListenerTemp)
//         parentNodeAtDepth = await updateByDepth(2)
//         await addEventListenerByDepth(2)
//         setCurrentDepth(depth_)
//         setDepth(prev => 2)
//         circleColor = '#F2BC79'
//         circleRadius = 500 * mapLevel
//         fontSize = 'text-2xl'
//       } else if (mapLevel >= 1 && mapLevel <= 6) {
//         window.kakao.maps.event.removeListener(map, 'dragend', eventListenerTemp)
//         parentNodeAtDepth = await updateByDepth(3)
//         await addEventListenerByDepth(3)
//         setCurrentDepth(depth_)
//         setDepth(prev => 3)
//         circleColor = '#6A95A6'
//         circleRadius = 100 * mapLevel
//         fontSize = 'text-xl'
//       }

//       await createCluster(parentNodeAtDepth)
//       // console.log(parentNodeAtDepth)

//       // !로 바꾸면 왠지 모르겠지만 작동하네..
//       if (parentNodeAtDepth !== root) {
//         // console.log("%croot change", "background: pink")
//         setRoot(parentNodeAtDepth)
//       }

//       window.kakao.maps.event.removeListener(map, 'dragend', eventListenerTemp)
//     }

//     main()
//   }, [
//     map,
//     mapLevel,
//     // clusterCircleArray,
//     root,
//     containIndex,
//     depth_,
//     // currentDepth,
//     // addEventListenerStatus,
//     selectedCircleName,
//     geocoder
//   ])

//   return (
//     <React.Fragment>
//       {/* <div>
//                 {containIndex}
//             </div>
//             <div>
//                 {clusterCircleArray.length}
//             </div>
//             <div>
//                 {root?.name}
//             </div> */}

//       <div className='w-full h-[1000px]'>
//         <div ref={mapContainer} className='w-full h-full z-0'></div>
//       </div>
//     </React.Fragment>
//   )
// }
