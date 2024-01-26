import { Button } from '@mui/material';
import { useRouter } from 'next/router'


const Home = () => {

  const router = useRouter();


  return (
    <div >
            
    <div style={{width: '900px', height: '600px', margin: '0 auto', border: '1px solid rgb(160, 160, 160)', borderRadius: '10px', textAlign: 'center', 
    marginTop: '10%', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: 'white'}}>
        <div style={{fontSize: '60px', color: 'rgb(60, 60, 60)'}}>스마트 센서 솔루션</div>
        <div style={{fontSize: '60px', color: 'rgb(60, 60, 60)'}}> I8-SENSOR</div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' , alignItems: 'center', marginTop: '10%'}}>
            <img src='/images/small_intsain_ci_v10_1.jpg' width='300px' alt='logo'></img>
        </div>
        <div style={{marginTop: '4%'}}>
            <Button variant={'contained'} onClick={()=> {router.push('/sensor/location')} }>데모 페이지로 이동</Button>
            {/* style={{ width: '200px', height: '40px', border: '1px solid black', borderRadius: '5px'}} */}
        </div> 

        
    </div>
</div>
  )
}

export default Home
