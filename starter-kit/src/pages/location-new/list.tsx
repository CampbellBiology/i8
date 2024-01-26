import { Box, Card } from "@mui/material";
import { DeviceListState, DeviceFilteredListState } from "../state";
import { useRecoilState } from "recoil";
import { useEffect, useState } from "react";

interface Device {
    product_serial_number: string,
    address: string,
    cluster: string,
    location: string,
    number?: number
}

export default function List() {

    const [device, setDevice] = useRecoilState(DeviceListState)
    const [list, setList] = useRecoilState(DeviceFilteredListState)

    useEffect(()=>{
        setList(device)
    }, [device, list, setList])

    return(
        <Box>
            {list.map((el: Device, index: number)=>{
                return(
                    <Card key={index} sx={{m:2, p:5, lineHeight: '28px', minWidth: '300px'}}>
                        <Box><b>SN: </b>{el.product_serial_number}</Box>
                        <Box><b>address: </b>{el.address}</Box>
                        <Box><b>cluster: </b>{el.cluster}</Box>
                        <Box><b>location: </b>{el.location}</Box>
                        {el.number? <Box><b>설치 기기 수: </b> {el.number}</Box> : <Box><b>설치 기기 수: </b> 설치된 기기가 없습니다.</Box>}
                    </Card>
                )
            })}
        </Box>
    )
}