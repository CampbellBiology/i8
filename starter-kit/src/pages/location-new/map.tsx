import { Box, Card } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { MapLevelState } from "../state";
import { useRecoilState } from "recoil";


export default function Map() {

  const mapContainer = useRef(null);
  const [map, setMap] = useState<any>(null);
  const [geocoder, setGeocoder] = useState<any>(null);
  const [mapLevel, setMapLevel] = useRecoilState(MapLevelState)

    useEffect(() => {
        const kakaoMapScript = document.createElement('script')
        kakaoMapScript.async = false
        kakaoMapScript.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAOMAP_API}&autoload=false&libraries=services,clusterer`;

        document.head.appendChild(kakaoMapScript)
      
        const onLoadKakaoAPI = () => {
          window.kakao.maps.load(() => {
            const mapOption = {
              center: new window.kakao.maps.LatLng(36.5, 127.5),
              level: 13,
          };

            const geocoder = new window.kakao.maps.services.Geocoder();
                setGeocoder(geocoder);
      
            const map = new window.kakao.maps.Map(mapContainer.current, mapOption);
            setMap(map);

            // 지도 확대 축소를 제어할 수 있는  줌 컨트롤을 생성합니다
            const zoomControl = new kakao.maps.ZoomControl();
            map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
            
            // 지도 레벨 변경 event listener
            window.kakao.maps.event.addListener(map, 'zoom_changed', function () {
              const level = map.getLevel();
              setMapLevel(level);
              });
          })
        }
      
        kakaoMapScript.addEventListener('load', onLoadKakaoAPI)
      }, [setMapLevel])

    console.log(mapLevel)

    return(
        <Box id="map" ref={mapContainer} sx={{width: '100%', height: '700px', minWidth: '400px', fontSize: '5px'}}>

        </Box>
    )
}