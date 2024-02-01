import { Box } from '@mui/material'

const Home = () => {
  return (
    <Box>
      <Box
        sx={{
          width: '80%',
          height: '100%',
          // minHeight: '800px',
          padding: '100px',
          paddingTop: '120px',
          paddingBottom: '120px',

          margin: '0 auto',
          border: '1px solid rgb(160, 160, 160)',
          borderRadius: '10px',
          textAlign: 'center',
          marginTop: '10%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: 'white'
        }}
      >
        <Box sx={{ fontSize: '60px', color: 'rgb(60, 60, 60)' }}>스마트 센서 솔루션</Box>
        <Box sx={{ fontSize: '60px', color: 'rgb(60, 60, 60)' }}> I8-SENSOR</Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '10%'
          }}
        >
          <img src='/images/small_intsain_ci_v10_1.jpg' width='300px' alt='logo'></img>
        </Box>
        <Box sx={{ marginTop: '4%' }}>
          {/* <Button variant={'contained'} onClick={()=> {router.push('/sensor/location')} }>데모 페이지로 이동</Button> */}
          {/* style={{ width: '200px', height: '40px', border: '1px solid black', borderRadius: '5px'}} */}
        </Box>
      </Box>
    </Box>
  )
}

export default Home
