import { Card, CardContent, CardHeader, Grid } from "@mui/material"
import Map from "./map"
import List from "./list"
import { useRecoilState } from "recoil"
import { DeviceListState, DeviceFilteredListState } from "../state"
import axios from "axios"
import { useEffect } from "react"

const LocationPage = () => {

    const [device, setDevice] = useRecoilState(DeviceListState)
    const [list, setList] = useRecoilState(DeviceFilteredListState)

    useEffect(()=>{
        axios.get("/api/device", {
            withCredentials: true,
        })
            .then(async (response) => {
                const res = response.data;
                    if (res.status === "success") {
                        setDevice(res.data)
                    } else {
                        console.log("fail");
                }
            })
        
    }, [])

    console.log(device)

    return(
    <Grid sx={{display: 'flex'}}>
        <Card sx={{width: '60%', m: 5, minWidth: '500px', maxHeight: '800px'}}>
            <CardHeader title='MAP'></CardHeader>
            <CardContent>
                <Map/>
            </CardContent>
        </Card>
        <Card sx={{width: '40%', m: 5, minWidth:'400px', maxHeight: '800px', overflow: 'auto'}}>
            <CardHeader title ="DEVICE LIST"></CardHeader>
            <CardContent>
                <List/>
            </CardContent>
        </Card>
    </Grid>
    )
}


export default LocationPage