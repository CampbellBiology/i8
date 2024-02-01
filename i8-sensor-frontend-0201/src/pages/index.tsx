import axios from 'axios'
import { useEffect } from 'react'
import { useRecoilState } from 'recoil'
import { DeviceListState } from './state'

const Home = () => {
  const [device, setDevice] = useRecoilState(DeviceListState)

  useEffect(() => {
    axios
      .get('/api/device', {
        withCredentials: true
      })
      .then(async response => {
        const res = response.data
        if (res.status === 'success') {
          setDevice(res.data)
        } else {
          console.log('fail')
        }
      })
  }, [setDevice])

  return <>Home Page</>
}

export default Home
