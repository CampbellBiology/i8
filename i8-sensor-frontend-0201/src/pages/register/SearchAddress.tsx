import React from 'react'
import DaumPostcode from 'react-daum-postcode'

import { Box, Button } from '@mui/material'

interface Props {
  onCompleteDaumPostcode: any
}

const AddressSearchModal = ({ onCompleteDaumPostcode, setAddressOpen }: Props) => {
  return (
    <React.Fragment>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          justifyItems: 'center',
          flexDirection: 'column',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          top: 0,
          left: 0,
          position: 'absolute',
          width: '100%',
          height: '100%',
          zIndex: 999
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            width: '50%',
            height: '50%',
            position: 'absolute',
            top: '30%',
            left: '20%'
          }}
          // className='flex flex-col gap-3 w-1/2 h-1/2'
        >
          <DaumPostcode onComplete={data => onCompleteDaumPostcode(data)} />
          <Button
            variant='contained'
            sx={{
              width: '100px',
              height: '50px',
              ml: 3,
              fontWeight: '800'
              // border: '5px solid rgba(250, 250, 250, 0.5)'
            }}
            onClick={() => setAddressOpen(false)}
          >
            닫기
          </Button>
        </Box>
      </Box>
    </React.Fragment>
  )
}

export default function SearchAddress({ setAddressDetail, setAddressOpen }) {
  const onCompleteDaumPostcode = (data: any) => {
    setAddressDetail(data.address)

    let fullAddress = data.address
    let extraAddress = ''

    const { addressType, bname, buildingName } = data
    if (addressType === 'R') {
      if (bname !== '') {
        extraAddress += bname
      }
      if (buildingName !== '') {
        extraAddress += `${extraAddress !== '' && ', '}${buildingName}`
      }
      fullAddress += `${extraAddress !== '' ? ` ${extraAddress}` : ''}`
    }
    console.log(fullAddress)
    setAddressOpen(false)
  }

  return (
    <>
      <AddressSearchModal onCompleteDaumPostcode={onCompleteDaumPostcode} setAddressOpen={setAddressOpen} />
    </>
  )
}
