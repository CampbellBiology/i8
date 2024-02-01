import { Box, Button, Card, CardContent, CardHeader } from '@mui/material'
import { DeviceListState, DeviceFilteredListState } from '../state'
import { useRecoilState } from 'recoil'
import { useEffect, useState } from 'react'
import { Device } from './interface/Device'
import Image from 'next/image'
import { useRouter } from 'next/router'

export default function List({ device, list, moveSlow, highlight }) {
  // console.log(device)
  const [addressList, setAddressList] = useState([])

  useEffect(() => {
    const address: string[] = []
    device.map((el: Device) => {
      if (!address.includes(el.address)) address.push(el.address)
    })

    const sortedAddress = address.sort()

    setAddressList(sortedAddress)
  }, [device])

  // console.log(addressList)

  const rollBack = () => {
    device.map(el => {
      const Items = document.getElementById(el.address) as HTMLElement
      Items.style.display = 'block'
    })
  }

  const router = useRouter()

  // router push func
  const moveToInfo = (address, cluster, location) => {
    console.log(address)
    console.log(cluster)
    console.log(location)

    const addressSplit = address.split(' ')
    console.log(addressSplit)

    // router query object create
    const queryObject = (
      selectedCity: string | null | undefined,
      selectedGu: string | null | undefined,
      selectedAddress: string | null,
      selectedGroup: string | null,
      selectedLocation: string | null
    ) => {
      const queryObjectResult = {
        selectedCity,
        selectedGu,
        selectedAddress,
        selectedGroup,
        selectedLocation
      }

      return queryObjectResult
    }

    router.push({
      pathname: '/info',
      query: queryObject(addressSplit[0], addressSplit[1], address, cluster, location)
    })
  }

  return (
    <Box>
      <Button sx={{ position: 'absolute', top: 18, right: 30 }} variant='outlined' onClick={rollBack}>
        초기화
      </Button>
      {addressList?.map((item: string) => {
        return (
          <Box key={item} id={item} style={{ marginBottom: '10px' }} sx={{ m: -3 }}>
            <CardHeader title={item ? item : '지정되지 않은 그룹명'} sx={{ m: 0 }} />
            <CardContent sx={{ m: -3 }}>
              {device
                .filter(el => el.address === item)
                .map((item, index) => {
                  return (
                    <Card
                      key={index}
                      // id={item.address}
                      sx={{
                        ':hover': { color: '#9155FD', border: '1px solid #9155FD', cursor: 'pointer' },
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: 5,
                        m: 3
                      }}
                      onClick={() => moveSlow(item.address)}
                    >
                      <Box>
                        <div>
                          <b>cluster</b> : {item.cluster ? item.cluster : '그룹명을 등록해주세요.'}
                        </div>
                        <div>
                          <b>location</b> : {item.location ? item.location : '장소명을 등록해주세요.'}
                        </div>
                        <div>
                          <b>S/N</b> : {item.product_serial_number}
                        </div>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Image
                          alt='arrow_circle_right'
                          src={'/img/arrow_circle_right.svg'}
                          width={30}
                          height={30}
                          className='hover:scale-110'
                          onClick={() => moveToInfo(item.address, item.cluster, item.location)}
                        />
                      </Box>
                    </Card>
                  )
                })}
            </CardContent>
          </Box>
        )
      })}
    </Box>
  )
}
