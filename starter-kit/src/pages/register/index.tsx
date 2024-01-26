
import { useEffect, useState } from "react";
import axios from "axios";
import Image from 'next/image';

// flowbite
import { Tooltip as TooltipFlowbite, Button } from 'flowbite-react';

interface Device {
    address: string
    product_serial_number: string
    cluster: string
    location: string
    location_image?: string
}

export default function RegisterPage() {
    const [addressOpen, setAddressOpen] = useState<boolean>(false); // 주소검색 오픈
    const [addressDetail, setAddressDetail] = useState<string>(''); // 자세한 주소 입력칸

    const [inputProductSerialNumber, setInputProductSerialNumber] = useState<string>("");
    const [inputCluster, setInputCluster] = useState<string>("");
    const [inputStatusMessage, setInputStatusMessage] = useState<string>("");
    const [inputLocation, setInputLocation] = useState<string>("");

    const [device, setDevice] = useState<Array<Device>>([]);

    const [image, setImage] = useState<File | null>(null);

    const [clusterList, setClusterList] = useState<Array<string>>([]);

    //장소 이미지용 240115
    // const [locationImage, setLocationImage] = useState<string>("");

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedImage: File = e.target.files[0];
        setImage(selectedImage);
    };

    const getDeviceInfo = async () => {
        console.log("get device info")

        const data = {}
        await axios.get("/api/device", {
            withCredentials: true,
        })
            .then((response) => {
                let res = response.data;
                if (res.status === "success") {
                    setDevice(res.data);
                    console.log(res.data)
                }
                else {
                    console.log("fail");
                }
            })

    }

     //장소 이미지용 240115
    // const getDeviceImage= async () => {
    //     await axios.get("/api/device/imageAll", {
    //         withCredentials: true,
    //     })
    //         .then((response) => {
    //             let res = response.data;
    //             if (res.status === "success") {
    //                 setLocationImage(res.data);
    //                 console.log(locationImage)
    //                 console.log(res.data)
    //             }
    //             else {
    //                 console.log("fail");
    //             }
    //         })
    // }

    const registerAddress = async () => {
        await axios.post("/api/device/register", {
            product_serial_number: inputProductSerialNumber,
            address: addressDetail,
            cluster: inputCluster,
            location: inputLocation
        }, {
            withCredentials: true,
        })
            .then((response) => {
                let res = response.data;
                if (res.status === "success") {
                    // setDevice(res.data);
                    console.log(res.data)
                    setInputStatusMessage("기기 등록이 완료되었습니다.")
                }
                else {
                    console.log("fail");
                }
            })

        const formData = new FormData();

        formData.append("image", image);
        formData.append("product_serial_number", inputProductSerialNumber);
        formData.append("cluster", inputCluster);
        formData.append("location", inputLocation);

        let config = {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            transformRequest: (formData: any) => formData
        }

        await axios.post("/api/device/image/register", formData, config).then((response) => {
            let res = response.data;

            if (res.status === "success") {
                setInputStatusMessage("기기 등록이 완료되었습니다.")
            }
            else {
                console.log("fail")
            }
        })
        // console.log("getDeviceInfo")
        getDeviceInfo();
    }

    const [snStatus, setSnStatus] = useState<boolean>(false)
    const registerAddressFunc = () => {
        // let snStatus = false;

        device.map((item: Device) => {
            if (item.product_serial_number === inputProductSerialNumber) {
                setSnStatus(true)
                // snStatus = true;
            }
        })

        if (inputProductSerialNumber === "") {
            setInputStatusMessage("시리얼 넘버를 입력해주세요.")
        }
        else if (inputCluster === "") {
            setInputStatusMessage("그룹명을 입력해주세요.")
        }
        else if (addressDetail === "") {
            setInputStatusMessage("위치를 입력해주세요.")
        }
        else if (inputLocation === "") {
            setInputStatusMessage("장소명을 입력해주세요.")
        }
        else if (!image) {
            setInputStatusMessage("이미지를 등록해주세요.")
        }
        else if (snStatus === true) {
            // else if (!snStatus) {
            setInputStatusMessage("시리얼 넘버를 다시 확인해 주세요.")
        }
        else {
            registerAddress();
        }
    }

    useEffect(() => {
        getDeviceInfo();
  
    }, [addressDetail])

    useEffect(() => {
        const clusters : string[] = [];

        //중복 제거한 클러스터 리스트
         device.map(el => {
            if (!clusters.includes(el.cluster)) clusters.push(el.cluster)
        })
        
        setClusterList(clusters)
        
    }, [device])

    console.log(clusterList)


    const deleteDevice = async(product_serial_number) => {

        console.log()

         await axios.post('/api/device/delete', {
            product_serial_number: product_serial_number
        }).then((res) => {
            const status = res.data.status;
            console.log(res.data)
            if (status === "success") {
                // const data = res.data.data;
                // console.log(data)
                // setDeviceDataByClusterKey(data);
            }
            else {
                console.log("ERROR")
            }
        })

        await axios.post('/api/device/delete/image', {
            product_serial_number: product_serial_number
        }).then((res) => {
            const status = res.data.status;
            console.log(res.data)
            if (status === "success") {
                // const data = res.data.data;
                // console.log(data)
                // setDeviceDataByClusterKey(data);
            }
            else {
                console.log("ERROR")
            }
        })
        
        await getDeviceInfo();
    }

    return (
        <>
            <div className="flex max-md:flex-col items-start justify-center">
                {/* left */}
                <div className="flex flex-col justify-start m-5 p-5 bg-white w-1/2 max-md:w-full min-w-[00px]"
                style={{border: '1px solid rgb(150, 150, 150)'}}>
                {/* <div className="flex flex-col justify-start m-5 p-5 bg-gray-200 w-1/2 max-md:w-full min-w-[300px]"> */}
                    {/* input : SN, cluster */}
                    <div className="flex flex-col justify-start xl:items-start xl:mb-3">
                        <div className="mr-3 my-5">
                            S/N
                        </div>
                        <div>
                            <input type="text"
                                onChange={(event) => setInputProductSerialNumber(event.target.value)}
                                className="p-2 rounded-xl max-xl:my-3"></input>
                        </div>

                        <div className="mr-3 my-5">
                            그룹명
                        </div>
                        <div>
                            <input type="text"
                                onChange={(event) => setInputCluster(event.target.value)}
                                className="p-2 rounded-xl"></input>
                        </div>

                        <div className="mr-3 my-5">
                            장소명
                        </div>
                        <div>
                            <input type="text"
                                onChange={(event) => setInputLocation(event.target.value)}
                                className="p-2 rounded-xl"></input>
                        </div>

                        {/* input : image */}
                        <div className="my-5">
                            <div className="mr-3 my-2">
                                장소 이미지 업로드
                            </div>
                            <div >
                                <input type="file" onChange={handleImageChange} />
                                {image && <img src={URL.createObjectURL(image)} alt="preview" />}
                            </div>
                        </div>
                    </div>

                    <div className="text-blue-500 mb-3">
                        {inputStatusMessage}
                    </div>

                    {/* input : address */}
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="mb-3">
                                위치
                            </div>
                            <div className="flex">
                                <input type="text" disabled
                                    className="p-2 bg-white rounded-xl mr-3"
                                    value={addressDetail}></input>
                                <Button color="gray" style={{border: '1px solid rgb(160, 160, 160)'}}
                                    onClick={() => setAddressOpen(true)}>
                                    주소 검색
                                </Button>
                            </div>
                        </div>
                        <div className="self-end">
                            <Button color="gray" style={{border: '1px solid rgb(160, 160, 160)'}}
                                onClick={() => registerAddressFunc()}>
                                등록
                            </Button>
                        </div>
                    </div>

                    <div>
                        {
                            addressOpen
                                ? <SearchAddress setAddressDetail={setAddressDetail} setAddressOpen={setAddressOpen} />
                                : null
                        }
                    </div>

                </div>

                {/* right */}
                <div className="flex flex-col justify-start m-5 p-5 bg-white w-1/2 max-md:w-full max-h-[1000px] min-w-[500px]" 
                style={{border: '1px solid rgb(150, 150, 150)'}}>
                {/* <div className="flex flex-col justify-start m-5 p-5 bg-gray-200 w-1/2 max-md:w-full max-h-[1000px] min-w-[500px]"> */}
                    <div className="mb-3">
                        <span className="text-xl font-semibold">
                            I8-SENSOR 목록
                        </span>
                    </div>
                    <div className="overflow-y-scroll" style={{backgroundColor: 'rgb(240, 240, 240)', border: '1px solid white', padding: '10px'}}>
                        {
                            // device?.map((item: Device) => {
                            //     return (
                            //         <>
                            //             <div className="border border-1 border-gray-500 rounded-xl p-4 bg-white mb-3" style={{position: 'relative'}}>
                                            
                            //                 <div>
                            //                     <b>S/N</b> : {item.product_serial_number}
                            //                 </div>
                            //                 <div>
                            //                     <b>address</b> : {item.address ? item.address : "시리얼 넘버를 입력하고 주소를 등록해주세요."}
                            //                 </div>
                            //                 <div>
                            //                     <b>cluster</b> : {item.cluster ? item.cluster : "그룹명을 등록해주세요."}
                            //                 </div>
                            //                 <div>
                            //                     <b>location</b> : {item.location ? item.location : "장소명을 등록해주세요."}
                            //                 </div>
                            //                 <div> 이미지: {item.image_url ? "등록 완료" : "이미지을 등록해주세요."} </div>
                            //                 {/* <Image src={ `data:image/png;base64,${item.image_url}`} alt="장소 이미지" width={20} height={10}></Image> */}
                                            
                            //                 <div  style={{position: 'absolute', right: '20px', top: '60px', border: '1px solid black', padding: '10px', borderRadius: '10px'}}>
                            //                     <button onClick={()=>deleteDevice(item.product_serial_number)}>삭제</button>
                            //                 </div>
                            //             </div>
                                        
                            //         </>
                            //     )
                            // })

                            clusterList?.map((item: Device)=> {
                                return(
                                    <div key={item} style={{marginBottom : '30px'}}>          
                                        <div style={{fontSize: '20px', marginBottom: '5px', marginTop: '5px', marginLeft: '5px'}}>
                                            {item ? item : "지정되지 않은 그룹명"}
                                        </div>

                                        {device.filter(el=> el.cluster === item).map((item, index)=>{

                                            return(
                                                <div key={index} className="border border-1 border-gray-500 rounded-xl p-4 bg-white mb-3" style={{position: 'relative'}}>
                                                    <div>
                                                        <b>S/N</b> : {item.product_serial_number}
                                                    </div>
                                                    <div>
                                                        <b>address</b> : {item.address ? item.address : "시리얼 넘버를 입력하고 주소를 등록해주세요."}
                                                    </div>
                                                    <div>
                                                        <b>cluster</b> : {item.cluster ? item.cluster : "그룹명을 등록해주세요."}
                                                    </div>
                                                    <div>
                                                        <b>location</b> : {item.location ? item.location : "장소명을 등록해주세요."}
                                                    </div>
                                                    <div> 
                                                        <b>이미지:</b> {item.image_url ? "등록 완료" : "이미지을 등록해주세요."} 
                                                    </div>
                                                        {/* <Image src={ `data:image/png;base64,${item.image_url}`} alt="장소 이미지" width={20} height={10}></Image> */}
                                            
                                                    <div style={{position: 'absolute', right: '20px', top: '60px'}}>
                                                        <Button color="gray"  style={{border: '1px solid rgb(160, 160, 160)'}} onClick={()=>deleteDevice(item.product_serial_number)}>삭제</Button>
                                                    </div>
                                                </div>
                                            )
                                        })}

                                    </div>
                                )
                            })
                        }
                    </div>

                </div>
            </div>
        </>
    )
}