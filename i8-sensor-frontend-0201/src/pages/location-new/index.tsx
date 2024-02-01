import { Box, Button, Card, CardContent, CardHeader, Grid } from '@mui/material'
import List from './list'
import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import LocationPage from '../location'
import { Device } from './interface/Device'

const NewLocationPage = () => {
  const [device, setDevice] = useState([])
  const [list, setList] = useState([])

  const highlight = (address: string) => {
    const selectedItem = document.getElementById(address) as HTMLElement

    device.map((item: Device) => {
      if (item.address === address) {
        // selectedItem.style.border = '1px solid #9155FD'
        selectedItem.style.display = 'block'
      } else {
        const notSelected = document.getElementById(item.address) as HTMLElement
        // notSelected.style.border = '1px solid #E5E7EB'
        notSelected.style.display = 'none'
      }
    })
  }

  useEffect(() => {
    axios
      .get('/api/device', {
        withCredentials: true
      })
      .then(async response => {
        const res = response.data
        if (res.status === 'success') {
          setDevice(res.data)
          setList(res.data)
        } else {
          console.log('fail')
        }
      })
  }, [])

  const mapContainer = useRef(null)
  const [map, setMap] = useState<any>(null)
  const [geocoder, setGeocoder] = useState<any>(null)
  const [mapLevel, setMapLevel] = useState()
  const [addressList, setAddressList] = useState([])

  useEffect(() => {
    const kakaoMapScript = document.createElement('script')
    kakaoMapScript.async = false
    kakaoMapScript.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAOMAP_API}&autoload=false&libraries=services,clusterer`

    document.head.appendChild(kakaoMapScript)

    const onLoadKakaoAPI = () => {
      window.kakao.maps.load(() => {
        const mapOption = {
          center: new window.kakao.maps.LatLng(36.5, 127.5),
          level: 13
        }

        const geocoder = new window.kakao.maps.services.Geocoder()
        setGeocoder(geocoder)

        const map = new window.kakao.maps.Map(mapContainer.current, mapOption)
        setMap(map)

        // 지도 확대 축소를 제어할 수 있는  줌 컨트롤을 생성합니다
        const zoomControl = new window.kakao.maps.ZoomControl()
        // map.addControl(zoomControl, window.kakao.maps.ControlPosition.TOPLEFT)
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.TOPLEFT)

        // 마커 이미지의 생성
        const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png'
        const imageSize = new window.kakao.maps.Size(24, 35)
        const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize)

        //지도 움직이거나 줌인해서 로딩이 끝났을 때 일어나는 리스너
        window.kakao.maps.event.addListener(map, 'tilesloaded', function () {
          //지도 레벨 업데이트
          const level = map.getLevel()
          setMapLevel(level)

          //지도가 주소를 포함했는지 판단
          const bounds = map.getBounds()
          const List: any = []

          //마커 그리기
          device.map((el: Device) => {
            geocoder.addressSearch(el.address, (result: any, status: any) => {
              if (status === window.kakao.maps.services.Status.OK) {
                const marker = new window.kakao.maps.Marker({
                  map: map, // 마커를 표시할 지도
                  position: new window.kakao.maps.LatLng(result[0].y, result[0].x), // 마커를 표시할 위치
                  clickable: true,
                  title: `address: ${el.address} ----- cluster: ${el.cluster} ----- location: ${el.location}`, // 마커의 타이틀, 마커에 마우스를 올리면 타이틀이 표시됩니다
                  image: markerImage // 마커 이미지
                })

                // 마커에 클릭이벤트를 등록합니다
                window.kakao.maps.event.addListener(marker, 'click', function () {
                  // 마커 위에 인포윈도우를 표시합니다
                  console.log(el.address)
                  highlight(el.address)
                })
              }

              //마커가 지도에 포함되어있는지 확인
              if (bounds.contain(new window.kakao.maps.LatLng(result[0].y, result[0].x))) {
                // console.log(el.address)
                List.push(el)
              }
            })
          })

          //지도에 포함된 장소 리스트
          setAddressList(List)

          //구분선
        })

        //구분
      })
    }

    kakaoMapScript.addEventListener('load', onLoadKakaoAPI)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device, setMapLevel, setAddressList])

  //주소로 좌표 이동
  const moveSlow = (address: string) => {
    console.log('move')
    geocoder.addressSearch(address, (result: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const moveLatLng = new window.kakao.maps.LatLng(result[0].y, result[0].x)
        map.panTo(moveLatLng)
      }
    })
  }

  // console.log(addressList)

  return (
    <Grid sx={{ display: 'flex', height: '80%' }}>
      <Card sx={{ width: '80%', m: 5, minWidth: '500px', maxHeight: '1100px' }}>
        <CardHeader title='MAP'></CardHeader>
        <CardContent>
          <Box
            id='map'
            ref={mapContainer}
            sx={{ width: '100%', minHeight: '700px', minWidth: '400px', fontSize: '5px' }}
          ></Box>
        </CardContent>
      </Card>
      <Card
        sx={{ width: '20%', m: 5, minWidth: '400px', maxHeight: '1100px', overflowY: 'auto', position: 'relative' }}
      >
        <CardHeader title='DEVICE LIST'></CardHeader>
        <CardContent>
          <List device={device} list={list} moveSlow={moveSlow} highlight={highlight} />
        </CardContent>
      </Card>
      <Box sx={{ display: 'none' }}>
        <LocationPage></LocationPage>
      </Box>
    </Grid>
  )
}

export default NewLocationPage
