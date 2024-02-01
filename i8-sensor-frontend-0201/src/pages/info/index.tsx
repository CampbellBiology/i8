// import react
import axios from 'axios'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import 'tailwindcss/tailwind.css'

import dynamic from 'next/dynamic'

// flowbite
import type { CustomFlowbiteTheme } from 'flowbite-react'
import { Flowbite } from 'flowbite-react'
import { Dropdown, Tooltip as FlowbiteTooltip, Table, Button } from 'flowbite-react'

// date picker
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

// state of recoil
import { DeviceClusterInfo, deviceClusterInfoState, globalRootState } from '../state'
import { useSetRecoilState, useRecoilValue } from 'recoil'

// root type
import { ClusterNode } from '../location/index'

// graph : react-chartjs-2
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Title,
  Legend
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import zoomPlugin from 'chartjs-plugin-zoom'
import { Box, Card, CardContent, CardHeader } from '@mui/material'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, zoomPlugin)

// button color
const customTheme: CustomFlowbiteTheme = {
  button: {
    color: {
      // dropdown: 'bg-gray-300 hover:bg-gray-400'
      dropdown: 'bg-white border border-gray-200 hover:bg-gray-200'
    }
  }
}

interface Device {
  address: string
  product_serial_number: string
  cluster: string
  measurement_timestamp: string
  temperature: number
  humidity: number
  receive_data_amount: number
  transmit_data_amount: number
}

interface Graph {
  deviceGraphData: any
  selectedGraph: any
  selectedGraphKey: any
  selectedGraphUnitKey: any
  startDate: any
  endDate: any
  selectedDataAmountUnitKey: any
  dataAmountData: any
}
const Graph = ({
  deviceGraphData,
  selectedGraph,
  selectedGraphKey,
  selectedGraphUnitKey,
  startDate,
  endDate,
  selectedDataAmountUnitKey,
  dataAmountData
}: Graph) => {
  // graph ref
  const chartRef: any = useRef(null)

  const graphColorArray = [
    {
      color: 'rgb(239, 71, 111)',
      colorWithOpacity: 'rgb(239, 71, 111, 0.5)'
    },
    {
      color: 'rgb(255, 209, 102)',
      colorWithOpacity: 'rgb(255, 209, 102, 0.5)'
    },
    {
      color: 'rgb(6, 214, 160)',
      colorWithOpacity: 'rgb(6, 214, 160, 0.5)'
    },
    {
      color: 'rgb(17, 138, 178)',
      colorWithOpacity: 'rgb(17, 138, 178, 0.5)'
    },

    {
      color: 'rgb(7, 59, 76)',
      colorWithOpacity: 'rgb(7, 59, 76, 0.5)'
    }
  ]

  const graphColorArrayByDataAmount = [
    {
      color: 'rgb(255, 194, 101)',
      colorWithOpacity: 'rgb(255, 194, 101, 0.5)'
    },
    {
      color: 'rgb(241, 136, 122)',
      colorWithOpacity: 'rgb(241, 136, 122, 0.5)'
    }
  ]

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const
      },
      title: {
        display: true,
        text: `${selectedGraph}`
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x' as const
        },
        zoom: {
          wheel: {
            enabled: true
          },
          pinch: {
            enabled: true
          },
          mode: 'x' as const
        }
      }
    }
  }

  const createData = () => {
    if (Object.keys(deviceGraphData).length !== 0) {
      let data: any = []

      Object.keys(deviceGraphData).map(async (serialNumber, idx) => {
        if (selectedGraphKey === 'temperature' || selectedGraphKey === 'humidity') {
          let dataObj = {
            label: serialNumber,
            data: deviceGraphData[serialNumber].map((item: any) => item[selectedGraphKey]),
            borderColor: graphColorArray[idx].color,
            backgroundColor: graphColorArray[idx].colorWithOpacity,
            borderWidth: 1
          }
          if (data.length < 5) {
            data.push(dataObj)
          }
        } else if (selectedGraphKey === 'data_amount') {
          if (selectedDataAmountUnitKey === 'average_data_amount') {
            let dataObj1 = {
              label: `${serialNumber} 수신량`,
              data: deviceGraphData[serialNumber].map((item: any) => item.receive_data_amount),
              borderColor: graphColorArrayByDataAmount[0].color,
              backgroundColor: graphColorArrayByDataAmount[0].colorWithOpacity,
              borderWidth: 1
            }
            let dataObj2 = {
              label: `${serialNumber} 송신량`,
              data: deviceGraphData[serialNumber].map((item: any) => item.transmit_data_amount),
              borderColor: graphColorArrayByDataAmount[1].color,
              backgroundColor: graphColorArrayByDataAmount[1].colorWithOpacity,
              borderWidth: 1
            }

            data.push(dataObj1)
            data.push(dataObj2)
          } else if (selectedDataAmountUnitKey === 'accumulate_data_amount') {
            let dataObj1 = {
              label: `${serialNumber} 누적 수신량`,
              data: (dataAmountData[serialNumber]?.cumulativeReceiveDataArray).map((item: any) => {
                const date = new Date(item.date)

                if (date >= new Date(startDate) && date <= new Date(endDate)) {
                  return item.cumulative
                }
              }),
              borderColor: graphColorArrayByDataAmount[0].color,
              backgroundColor: graphColorArrayByDataAmount[0].colorWithOpacity,
              borderWidth: 1
            }
            let dataObj2 = {
              label: `${serialNumber} 누적 송신량`,
              data: (dataAmountData[serialNumber]?.cumulativeTransmitDataArray).map((item: any) => {
                const date = new Date(item.date)

                if (date >= new Date(startDate) && date <= new Date(endDate)) {
                  return item.cumulative
                }
              }),
              borderColor: graphColorArrayByDataAmount[1].color,
              backgroundColor: graphColorArrayByDataAmount[1].colorWithOpacity,
              borderWidth: 1
            }

            data.push(dataObj1)
            data.push(dataObj2)
          }
        }
      })

      return data
    } else {
      return []
    }
  }

  const createDate = () => {
    if (Object.keys(deviceGraphData).length !== 0) {
      // 각 단말 중, 가장 데이터 길이가 긴 단말의 date 데이터를 가져옴
      const largestSerialNumber = Object.keys(deviceGraphData).reduce((maxSerialNumber, currentSerialNumber) => {
        const currentLength = deviceGraphData[currentSerialNumber].length

        if (currentLength > deviceGraphData[maxSerialNumber].length) {
          return currentSerialNumber
        } else {
          return maxSerialNumber
        }
      })

      const getDateArray = () => {
        const arr = []

        const formatDate = (date: any) => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')

          if (selectedGraphUnitKey === 'min') {
            return `${year}-${month}-${day} ${hours}:${minutes}`
          } else if (selectedGraphUnitKey === 'day') {
            return `${year}-${month}-${day}`
          } else if (selectedGraphUnitKey === 'mon') {
            return `${year}-${month}`
          } else if (selectedGraphUnitKey === 'year') {
            return `${year}`
          }
        }

        if (selectedGraphUnitKey === 'min') {
          for (let d = new Date(startDate); d <= new Date(endDate); d.setMinutes(d.getMinutes() + 1)) {
            const formattedTimestamp = formatDate(d)
            arr.push(formattedTimestamp)
          }
        } else if (selectedGraphUnitKey === 'day') {
          for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
            const formattedTimestamp = formatDate(d)
            arr.push(formattedTimestamp)
          }
        } else if (selectedGraphUnitKey === 'mon') {
          for (let d = new Date(startDate); d <= new Date(endDate); d.setMonth(d.getMonth() + 1)) {
            const formattedTimestamp = formatDate(d)
            arr.push(formattedTimestamp)
          }
        } else if (selectedGraphUnitKey === 'year') {
          for (let d = new Date(startDate); d <= new Date(endDate); d.setFullYear(d.getFullYear() + 1)) {
            const formattedTimestamp = formatDate(d)
            arr.push(formattedTimestamp)
          }
        }

        return arr
      }

      // const data = getDateArray(startDate, endDate)
      const data = getDateArray()

      return data
    } else {
      return []
    }
  }

  const data = {
    labels: createDate(),
    datasets: createData()
  }

  const resetZoomTrigger = () => {
    if (chartRef && chartRef.current) {
      chartRef.current.resetZoom()
    }
  }

  return (
    <React.Fragment>
      {selectedGraphKey === 'temperature' || selectedGraphKey === 'humidity' ? (
        <Line ref={chartRef} options={options} data={data} />
      ) : (
        <Bar ref={chartRef} options={options} data={data} />
      )}

      <Button onClick={resetZoomTrigger} color='gray'>
        reset zoom
      </Button>
      <div className='clear-both'></div>
    </React.Fragment>
  )
}
interface DateProps {
  setDate: any
  date: any
}
const DateRange = ({ setDate, date }: DateProps) => {
  const [selected, setSelected] = useState(false)

  return (
    <DatePicker
      className='rounded text-sm hover:cursor-pointer border border-1 m-3'
      showIcon
      dateFormat='yyyy-MM-dd h:mm aa'
      selected={selected ? date : null}
      timeInputLabel='시간: '
      showTimeInput
      onChange={(date: Date) => {
        setSelected(true)
        setDate(date)
      }}
      // icon='fa fa-calendar'
      placeholderText={
        date
          ? `${String(date.getFullYear()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
              date.getDate()
            ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(
              2,
              '0'
            )}:${String(date.getSeconds()).padStart(2, '0')}`
          : undefined
      }
    />
  )
}

// const DateRange =({setDate, date})=>{
//     const [selected, setSelected] = useState(false);

//     const [startDate, setStartDate] = useState(new Date("2023/12/01"));
//     const [endDate, setEndDate] = useState(new Date("2023/12/03"));
//     return (
//       <>
//         <DatePicker
//         className="rounded text-sm hover:cursor-pointer border border-1 m-3"
//          showIcon
//             dateFormat="yyyy-MM-dd h:mm aa"
//             selected={selected ? startDate : null}
//         //   selected={startDate}
//         icon="fa fa-calendar"
//         onChange={(date: Date) => {
//                             setSelected(true)
//                             setDate(date)
//                             setStartDate(date)
//                         }}
//         //   onChange={(date) => setStartDate(date)}
//           selectsStart
//           startDate={startDate}
//           endDate={endDate}
//           placeholderText={
//                             date
//                                 ?
//                                 `${String(date.getFullYear()).padStart(2, '0')}-${(String(date.getMonth() + 1)).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
//                                 :
//                                 null}
//         />
//         <DatePicker
//          className="rounded text-sm hover:cursor-pointer border border-1 m-3"
//          showIcon
//             dateFormat="yyyy-MM-dd h:mm aa"
//             selected={selected ? endDate : null}
//         //   selected={endDate}
//         icon="fa fa-calendar"
//         onChange={(date: Date) => {
//             setSelected(true)
//             setDate(date)
//             setEndDate(date)
//         }}
//         //   onChange={(date) => setEndDate(date)}
//           selectsEnd
//           startDate={startDate}
//           endDate={endDate}
//           minDate={startDate}
//           placeholderText={
//             date
//                 ?
//                 `${String(date.getFullYear()).padStart(2, '0')}-${(String(date.getMonth() + 1)).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
//                 :
//                 null}
//         />
//       </>
//     );
// }

interface dropdownprops {
  selectedItem: any
  setSelectedItem: any
  setSelectedItemKey: any
  data: any
  keyData: any
  graph: any
  graph2: any
  setGraphMessage: any
}

const SelectDropDown = ({
  selectedItem, // 드롭다운 label
  setSelectedItem, // 드롭다운 setLabel
  setSelectedItemKey, // 드롭다운 key
  data, // 실제 데이터
  keyData, // 드롭다운 key 배열
  graph, // graph 관련 드롭다운인가?
  graph2,
  setGraphMessage
}: dropdownprops) => {
  return (
    <React.Fragment>
      <div className='mr-1 mb-1'>
        <Flowbite theme={{ theme: customTheme }}>
          {graph ? (
            <Dropdown color='dropdown' label={selectedItem} dismissOnClick={true}>
              {data?.map((item: string, idx: number) => {
                return (
                  <Dropdown.Item
                    key={item}
                    onClick={() => {
                      setSelectedItem(item)
                      setSelectedItemKey(keyData[idx])
                      {
                        graph2 ? setGraphMessage('') : null
                      }
                    }}
                  >
                    {item}
                  </Dropdown.Item>
                )
              })}
            </Dropdown>
          ) : (
            <Dropdown color='dropdown' label={selectedItem ? selectedItem : '선택'} dismissOnClick={true}>
              {data?.map((item: ClusterNode) => {
                return (
                  <Dropdown.Item
                    key={item.name}
                    onClick={() => {
                      setSelectedItem(item.name)
                    }}
                  >
                    {item.name}
                  </Dropdown.Item>
                )
              })}
            </Dropdown>
          )}
        </Flowbite>
      </div>
    </React.Fragment>
  )
}

interface stickerprops {
  serialNumber: any
  data: any
  setDeviceCoordinates: any
  deviceCoordinates: any
}
const Sticker_ = ({ serialNumber, data, setDeviceCoordinates, deviceCoordinates }: stickerprops) => {
  const wrapRef = useRef<HTMLDivElement>(null)

  let lastX = 0
  let lastY = 0
  let startX = 0
  let startY = 0
  let parentX = 800
  let parentY = 600

  const onMove = useCallback((e: MouseEvent) => {
    e.preventDefault()

    if (!wrapRef.current) return
    if (!wrapRef.current.parentElement) return

    // eslint-disable-next-line react-hooks/exhaustive-deps
    lastX = startX - e.clientX
    // eslint-disable-next-line react-hooks/exhaustive-deps
    lastY = startY - e.clientY

    // eslint-disable-next-line react-hooks/exhaustive-deps
    startX = e.clientX
    // eslint-disable-next-line react-hooks/exhaustive-deps
    startY = e.clientY

    if (
      wrapRef.current.offsetTop - lastY >=
        wrapRef.current?.parentElement?.offsetTop + parentY - wrapRef.current?.clientHeight ||
      wrapRef.current?.offsetTop - lastY <= wrapRef.current?.parentElement?.offsetTop
    ) {
      return
    }
    if (
      wrapRef.current.offsetLeft - lastX >=
        parentX - wrapRef.current?.parentElement?.offsetLeft * 2 - wrapRef.current?.clientWidth / 2 ||
      wrapRef.current.offsetLeft - lastX <= wrapRef.current?.parentElement?.offsetLeft
    ) {
      return
    }
    wrapRef.current.style.top = `${wrapRef.current.offsetTop - lastY}px`
    wrapRef.current.style.left = `${wrapRef.current.offsetLeft - lastX}px`

    let coordinate = {
      imageX: wrapRef.current.offsetTop - lastY,
      imageY: wrapRef.current.offsetLeft - lastX
    }

    let copyData = { ...deviceCoordinates }
    copyData[serialNumber] = coordinate
    setDeviceCoordinates(copyData)
  }, [])

  const removeEvent = useCallback(() => {
    document.removeEventListener('mouseup', removeEvent)
    document.removeEventListener('mousemove', onMove)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // const onMouseDown = useCallback((e: MouseEvent) => {
  const onMouseDown = React.useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    startX = e.clientX
    // eslint-disable-next-line react-hooks/exhaustive-deps
    startY = e.clientY

    document.addEventListener('mouseup', removeEvent)
    document.addEventListener('mousemove', onMove)
  }, [])

  const getImageCoordinate = async () => {
    await axios
      .post('/api/device/image/coordinate', {
        product_serial_number: serialNumber
      })
      .then(response => {
        const res = response.data

        if (res.status === 'success') {
          if (wrapRef && res.data.imageX && res.data.imageY) {
            if (!wrapRef.current) return

            wrapRef.current.style.top = `${res.data.imageX}px`
            wrapRef.current.style.left = `${res.data.imageY}px`
          }
        } else {
          console.log('fail')
        }
      })
  }

  useEffect(() => {
    getImageCoordinate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapRef])

  return (
    <div className='flex'>
      {/* <div ref={wrapRef} onMouseDown={onMouseDown} alt={serialNumber} className='absolute cursor-pointer flex'></div> */}
      <div ref={wrapRef} onMouseDown={onMouseDown} className='absolute cursor-pointer flex'>
        <FlowbiteTooltip
          className='w-[150px] whitespace-pre'
          content={`S/N: ${serialNumber}\n온도 : ${data.length ? data[0].temperature : '-'}℃\n습도 : ${
            data.length ? data[0].humidity : '-'
          }%`}
        >
          <Image src='/img/sensor.png' width={50} height={100} alt={serialNumber} />
        </FlowbiteTooltip>
      </div>
    </div>
  )
}

interface stickerTestProps {
  graphCount: any
  deviceGraphData: any
  deviceImage: any
  deviceGraphCopyData: any
}
interface DeviceCoordinates {
  [key: string]: {
    imageX: number | null // Assuming imageX is a number or null
    imageY: number | null // Assuming imageY is a number or null
  }
}
const StickerTest = ({ graphCount, deviceGraphData, deviceImage, deviceGraphCopyData }: stickerTestProps) => {
  const [deviceImageSrc, setDeviceImageSrc] = useState<string>()
  const [deviceCoordinates, setDeviceCoordinates] = useState<DeviceCoordinates>({})

  // 이미지 위 기기 데이터 좌표 고정
  const setDeviceImageCoordinates = async () => {
    Object.keys(deviceGraphData).map(async key => {
      await axios.post('/api/device/image/register/coordinate', {
        product_serial_number: key,
        // image_x: deviceCoordinates[key].imageX,
        // image_y: deviceCoordinates[key].imageY
        image_x: deviceCoordinates[key]?.imageX ?? null, // Access safely with ?. and provide a default value if null
        image_y: deviceCoordinates[key]?.imageY ?? null
      })
    })
  }

  useEffect(() => {
    let graphCountArrayCopy = []
    let i = 0

    while (i < graphCount) {
      graphCountArrayCopy.push(i)
      i++
    }

    const deviceImageSrc_ = `data:image/png;base64,${deviceImage}`
    setDeviceImageSrc(deviceImageSrc_)

    for (let key in Object.keys(deviceGraphData)) {
      deviceCoordinates[key] = {
        imageX: null,
        imageY: null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphCount])

  return (
    <React.Fragment>
      <div
        className='bg-gray-200 w-fit py-1 px-2 mb-3 rounded hover:cursor-pointer hover:brightness-90'
        onClick={() => setDeviceImageCoordinates()}
      >
        ✅ 기기 위치 저장
      </div>
      <div
        style={{
          backgroundImage: `url('${deviceImageSrc}')`,
          height: '600px',
          width: '800px',
          backgroundSize: 'cover'
        }}
      >
        <div>
          {Object.keys(deviceGraphData).map(key => {
            return (
              <Sticker_
                key={key}
                serialNumber={key}
                data={deviceGraphCopyData[key]}
                deviceCoordinates={deviceCoordinates}
                setDeviceCoordinates={setDeviceCoordinates}
              />
            )
          })}
        </div>
      </div>
    </React.Fragment>
  )
}

const TableHeader = () => {
  return (
    <React.Fragment>
      <Table.HeadCell className='text-center'>누적</Table.HeadCell>
      <Table.HeadCell className='text-center'>일평균</Table.HeadCell>
      <Table.HeadCell className='text-center'>월평균</Table.HeadCell>
      <Table.HeadCell className='text-center'>연평균</Table.HeadCell>
    </React.Fragment>
  )
}

const DataAmountTable = ({ data }) => {
  // useEffect(() => {}, [])

  return (
    <React.Fragment>
      {/* 누적 */}
      <Table.Cell className='whitespace-nowrap font-medium text-gray-900 dark:text-white'>{data.all}</Table.Cell>
      {/* 일평균 */}
      <Table.Cell className='whitespace-nowrap font-medium text-gray-900 dark:text-white'>{data.daily}</Table.Cell>
      {/* 월평균 */}
      <Table.Cell className='whitespace-nowrap font-medium text-gray-900 dark:text-white'>{data.month}</Table.Cell>
      {/* 연평균 */}
      <Table.Cell className='whitespace-nowrap font-medium text-gray-900 dark:text-white'>{data.year}</Table.Cell>
    </React.Fragment>
  )
}

interface csvProps {
  tableId: string
  filename?: string
}

const CsvDownload = ({ tableId, filename }: csvProps) => {
  const downloadCsv = () => {
    const table = document.getElementById(tableId) as HTMLTableElement
    if (!table) {
      console.error(`Table with id '${tableId}' not found.`)
      return
    }

    const headers = []
    const rows = []

    // 테이블 헤더 가져오기
    const headerRow = table.rows[0]
    for (let i = 0; i < headerRow.cells.length; i++) {
      if (tableId === 'data_amount_table') {
        if (headerRow.cells[i].textContent === '제품 정보') {
          headers.push('제품 정보')
          headers.push('')
        } else if (headerRow.cells[i].textContent === '송신량') {
          headers.push('송신량')
          headers.push('')
          headers.push('')
          headers.push('')
        } else if (headerRow.cells[i].textContent === '수신량') {
          headers.push('수신량')
          headers.push('')
          headers.push('')
          headers.push('')
        } else if (headerRow.cells[i].textContent === '송수신량') {
          headers.push('송수신량')
          headers.push('')
          headers.push('')
          headers.push('')
        }
      } else {
        headers.push(headerRow.cells[i].textContent)
      }
    }

    // 테이블 내용 가져오기
    for (let i = 1; i < table.rows.length; i++) {
      const row = table.rows[i]
      const rowData = []
      for (let j = 0; j < row.cells.length; j++) {
        rowData.push(row.cells[j].textContent)
      }
      rows.push(rowData.join(','))
    }

    // CSV 파일 생성 및 다운로드
    // 인코딩 이슈로, BOM 문자를 추가함
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n') // BOM 문자 추가
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename || 'download.csv')
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Button color='gray' className='mb-3' onClick={downloadCsv}>
      Download CSV
    </Button>
  )
}

const AllDataToCSV = ({
  deviceGraphData,
  deviceGraphCopyData,

  tableTemperatureStatus,
  tableHumidityStatus,
  tableTransmitStatus,
  tableReceiveStatus
}) => {
  return (
    <React.Fragment>
      <CsvDownload tableId='all_data_table' filename='table_data.csv' />
      <div className='h-[570px] overflow-y-scroll'>
        <Table id='all_data_table'>
          <Table.Head className='sticky top-0 text-center'>
            <Table.HeadCell>제품명</Table.HeadCell>
            <Table.HeadCell>SN</Table.HeadCell>

            {tableTemperatureStatus ? <Table.HeadCell>온도 (℃)</Table.HeadCell> : null}
            {tableHumidityStatus ? <Table.HeadCell>습도 (%)</Table.HeadCell> : null}
            {tableTransmitStatus ? <Table.HeadCell>송신량</Table.HeadCell> : null}
            {tableReceiveStatus ? <Table.HeadCell>수신량</Table.HeadCell> : null}
            <Table.HeadCell>수신 일시</Table.HeadCell>
          </Table.Head>

          <Table.Body className='divide-y text-center'>
            {Object.keys(deviceGraphData).map(key => {
              const item = deviceGraphData[key]

              return item.map((obj, idx) => {
                let date = new Date(obj.measurement_timestamp)
                return (
                  <Table.Row key={`${key}-${idx}-all-data-table`}>
                    <Table.Cell>I8-SENSOR</Table.Cell>
                    <Table.Cell>{obj.product_serial_number}</Table.Cell>

                    {tableTemperatureStatus ? <Table.Cell>{obj.temperature ? obj.temperature : '-'}</Table.Cell> : null}
                    {tableHumidityStatus ? <Table.Cell>{obj.humidity ? obj.humidity : '-'}</Table.Cell> : null}
                    {tableTransmitStatus ? <Table.Cell>{obj.transmit_data_amount}</Table.Cell> : null}
                    {tableReceiveStatus ? <Table.Cell>{obj.receive_data_amount}</Table.Cell> : null}
                    <Table.Cell>
                      {`${String(date.getFullYear()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(
                        2,
                        '0'
                      )}-${String(date.getDate()).padStart(2, '0')}`}{' '}
                      <br />
                      {`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(
                        2,
                        '0'
                      )}:${String(date.getSeconds()).padStart(2, '0')}`}
                    </Table.Cell>
                  </Table.Row>
                )
              })
            })}
          </Table.Body>
        </Table>
      </div>
    </React.Fragment>
  )
}

const DataAmountToCSV = ({
  deviceGraphCopyData,
  tableTransmitStatus,
  tableReceiveStatus,
  tableTransmitAndReceiveStatus,
  deviceDataAmountObject
}) => {
  return (
    <React.Fragment>
      <CsvDownload tableId='data_amount_table' filename='table_data.csv' />
      <div className='h-[570px] overflow-y-scroll'>
        <Table id='data_amount_table'>
          <Table.Head className='sticky top-0 text-center'>
            <Table.HeadCell colSpan='2'>제품 정보</Table.HeadCell>
            {tableTransmitStatus ? <Table.HeadCell colSpan='4'>송신량</Table.HeadCell> : null}

            {tableReceiveStatus ? <Table.HeadCell colSpan='4'>수신량</Table.HeadCell> : null}

            {tableTransmitAndReceiveStatus ? <Table.HeadCell colSpan='4'>송수신량</Table.HeadCell> : null}
          </Table.Head>

          <Table.Head className='sticky top-10 text-center'>
            {/* 제품 정보 */}
            <Table.HeadCell>제품명</Table.HeadCell>
            <Table.HeadCell>SN</Table.HeadCell>

            {tableTransmitStatus ? <TableHeader /> : null}

            {tableReceiveStatus ? <TableHeader /> : null}

            {tableTransmitAndReceiveStatus ? <TableHeader /> : null}
          </Table.Head>

          <Table.Body className='divide-y text-center'>
            {Object.keys(deviceGraphCopyData).map(serialNumber => {
              let item = deviceGraphCopyData[serialNumber]
              let amountItem = deviceDataAmountObject[serialNumber]

              const transmitDataAmountInfoBySerialNumber = {
                all: amountItem?.transmit.all,
                daily: amountItem?.transmit.daily,
                month: amountItem?.transmit.month,
                year: amountItem?.transmit.year
              }

              const receiveDataAmountInfoBySerialNumber = {
                all: amountItem?.receive.all,
                daily: amountItem?.receive.daily,
                month: amountItem?.receive.month,
                year: amountItem?.receive.year
              }

              const allDataAmountInfoBySerialNumber = {
                all: transmitDataAmountInfoBySerialNumber.all + receiveDataAmountInfoBySerialNumber.all,
                daily: transmitDataAmountInfoBySerialNumber.all + receiveDataAmountInfoBySerialNumber.daily,
                month: transmitDataAmountInfoBySerialNumber.all + receiveDataAmountInfoBySerialNumber.month,
                year: transmitDataAmountInfoBySerialNumber.all + receiveDataAmountInfoBySerialNumber.year
              }

              return (
                <Table.Row key={JSON.stringify(item)} className='bg-white dark:border-gray-700 dark:bg-gray-800 '>
                  {/* 제품 정보 */}
                  <Table.Cell className='whitespace-nowrap font-medium text-gray-900 dark:text-white'>
                    I8-SENSOR
                  </Table.Cell>
                  <Table.Cell className='whitespace-nowrap font-medium text-gray-900 dark:text-white'>
                    {serialNumber}
                  </Table.Cell>

                  {/* 송신량 */}
                  {tableTransmitStatus ? <DataAmountTable data={transmitDataAmountInfoBySerialNumber} /> : null}
                  {/* 수신량 */}
                  {tableReceiveStatus ? <DataAmountTable data={receiveDataAmountInfoBySerialNumber} /> : null}
                  {/* 송수신량 */}
                  {tableTransmitAndReceiveStatus ? <DataAmountTable data={allDataAmountInfoBySerialNumber} /> : null}
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      </div>
    </React.Fragment>
  )
}

export default function InfoPage() {
  const router = useRouter()

  let checkedClusterName = router?.query.checkedClusterName
  let checkedClusterInfoName = router?.query.checkedClusterInfoName

  // 루트를 전역으로 관리
  const reqGlobalRootState: ClusterNode = useRecoilValue(globalRootState)
  const setReqGlobalRootState = useSetRecoilState(globalRootState)

  const [deviceData, setDeviceData] = useState([])
  const [deviceGraphData, setDeviceGraphData] = useState({})
  const [deviceGraphCopyData, setDeviceGraphCopyData] = useState({})

  // date 기반 송수신량 일/월/연평균
  const [deviceDataAmountObject, setDeviceDataAmountObject] = useState({})

  // 데이터 사용량 그래프 radio 선택
  const [selectedDataAmountUnitKey, setSelectedDataAmountUnitKey] = useState('average_data_amount')

  // date 기반 누적 송수신량
  const [accumulateReceiveAndTransmitData, setAccumulateReceiveAndTransmitData] = useState()

  // date range pick
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [searchGraphDataBySelectedDateStatus, setSearchGraphDataBySelectedDateStatus] = useState('')

  const [graphCount, setGraphCount] = useState(0)

  // dropdown
  // const [selectedGraph, setSelectedGraph] = useState('온도 그래프')
  const [selectedGraph, setSelectedGraph] = useState('온도 그래프')
  const [selectedGraphKey, setSelectedGraphKey] = useState('temperature')

  const [selectedGraphUnit, setSelectedGraphUnit] = useState('일')
  const [selectedGraphUnitKey, setSelectedGraphUnitKey] = useState('day')

  //그래프 디폴트 메세지
  const [graphMessage, setGraphMessage] = useState('장소를 변경하고 기기를 선택해주세요.')

  // 모든 노드
  const [allDataNode, setAllDataNode] = useState<Array<ClusterNode>>()

  const getDeviceData = async () => {
    await axios.get('/api/device').then(response => {
      let res = response.data
      if (res.status === 'success') {
        if (!deviceData.length) setDeviceData(res.data)
      } else {
        console.log('fail')
      }
    })
  }

  async function onCheckedElement(target: HTMLInputElement, checked: boolean, serialNumber: string) {
    setGraphMessage('')

    // 그래프에 그릴 데이터 추가
    if (checked) {
      if (graphCount > 4) {
        target.checked = false
        return
      }

      if (!deviceDataByClusterKey) return

      let data = deviceDataByClusterKey.filter((item: Device) => item.product_serial_number === serialNumber)

      await data.sort((a: Device, b: Device) => {
        const dateA: any = new Date(a.measurement_timestamp)
        const dateB: any = new Date(b.measurement_timestamp)
        return dateA - dateB
      })

      let deviceGraphDataCopy: any = { ...deviceGraphData }
      deviceGraphDataCopy[serialNumber] = data

      setDeviceGraphData(deviceGraphDataCopy)
      setDeviceGraphCopyData(deviceGraphDataCopy)
      setGraphCount(prev => prev + 1)
    } else {
      let deviceGraphDataCopy: any = { ...deviceGraphData }
      delete deviceGraphDataCopy[serialNumber]
      setDeviceGraphData(deviceGraphDataCopy)
      setDeviceGraphCopyData(deviceGraphDataCopy)
      setGraphCount(prev => prev - 1)
    }
  }

  const cumulativeDataCalculator = (data, key, accumulateObj) => {
    const calculateCumulativeData = () => {
      if (data.length === 0) {
        return
      }

      const sortedData = data

      const cumulativeReceiveDataArray = sortedData.reduce((accumulator, currentValue) => {
        const cumulativeValue =
          accumulator.length > 0
            ? accumulator[accumulator.length - 1].cumulative + currentValue.sum_receive_data_amount
            : currentValue.sum_receive_data_amount

        return [
          ...accumulator,
          {
            date: currentValue.measurement_timestamp,
            cumulative: cumulativeValue
          }
        ]
      }, [])

      const cumulativeTransmitDataArray = sortedData.reduce((accumulator, currentValue) => {
        const cumulativeValue =
          accumulator.length > 0
            ? accumulator[accumulator.length - 1].cumulative + currentValue.sum_transmit_data_amount
            : currentValue.sum_transmit_data_amount

        return [
          ...accumulator,
          {
            date: currentValue.measurement_timestamp,
            cumulative: cumulativeValue
          }
        ]
      }, [])

      return { cumulativeReceiveDataArray, cumulativeTransmitDataArray }
    }

    const { cumulativeReceiveDataArray, cumulativeTransmitDataArray } = calculateCumulativeData()

    accumulateObj[key] = {
      cumulativeReceiveDataArray: cumulativeReceiveDataArray,
      cumulativeTransmitDataArray: cumulativeTransmitDataArray
    }
  }

  async function triggerSearchGraphDataBySelectedDate() {
    if (!startDate || !endDate) return

    if (startDate > endDate) {
      setSearchGraphDataBySelectedDateStatus('기간을 다시 확인해 주세요.')
    } else {
      setSearchGraphDataBySelectedDateStatus('')
      let deviceGraphDataCopy: any = { ...deviceGraphCopyData }
      let deviceListDataCopy: any = { ...deviceGraphCopyData }

      let deviceDataAmountObjectCopy: any = { ...deviceDataAmountObject }

      // 기기별로 적용
      // await Object.keys(deviceListDataCopy).map(async (key: string) => {
      await Promise.all(
        Object.keys(deviceListDataCopy).map(async (key: string) => {
          let deviceListDataKeyCopy = [...deviceListDataCopy[key]]

          // 설정한 기간 내의 데이터만 filtering
          const deviceListDataFiltered: any = deviceListDataKeyCopy.filter(
            item =>
              new Date(item.measurement_timestamp) >= new Date(startDate) &&
              new Date(item.measurement_timestamp) <= new Date(endDate)
          )

          let sum_receive = 0
          let sum_transmit = 0

          let receive_averages: any = {
            dailyAverages: {},
            monthlyAverages: {},
            yearAverages: {}
          }

          let transmit_averages: any = {
            dailyAverages: {},
            monthlyAverages: {},
            yearAverages: {}
          }

          await Object.keys(deviceListDataFiltered).map(async (key: string) => {
            const now = deviceListDataFiltered[key]

            // 누적
            sum_receive += now.receive_data_amount
            sum_transmit += now.transmit_data_amount

            const date = new Date(now.measurement_timestamp)
            const daily = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
            const month = `${date.getFullYear()}-${date.getMonth() + 1}`
            const year = `${date.getFullYear()}`

            // 일평균
            if (!receive_averages.dailyAverages[daily]) {
              receive_averages.dailyAverages[daily] = {
                sum: now.receive_data_amount,
                count: 1
              }
            } else {
              receive_averages.dailyAverages[daily].sum += now.receive_data_amount ? now.receive_data_amount : 0
              receive_averages.dailyAverages[daily].count += 1
            }

            if (!transmit_averages.dailyAverages[daily]) {
              transmit_averages.dailyAverages[daily] = {
                sum: now.transmit_data_amount,
                count: 1
              }
            } else {
              transmit_averages.dailyAverages[daily].sum += now.transmit_data_amount ? now.transmit_data_amount : 0
              transmit_averages.dailyAverages[daily].count += 1
            }

            // 월평균
            if (!receive_averages.monthlyAverages[month]) {
              receive_averages.monthlyAverages[month] = {
                sum: now.receive_data_amount,
                count: 1
              }
            } else {
              receive_averages.monthlyAverages[month].sum += now.receive_data_amount ? now.receive_data_amount : 0
              receive_averages.monthlyAverages[month].count += 1
            }

            if (!transmit_averages.monthlyAverages[month]) {
              transmit_averages.monthlyAverages[month] = {
                sum: now.transmit_data_amount,
                count: 1
              }
            } else {
              transmit_averages.monthlyAverages[month].sum += now.transmit_data_amount ? now.transmit_data_amount : 0
              transmit_averages.monthlyAverages[month].count += 1
            }

            // 연평균
            if (!receive_averages.yearAverages[year]) {
              receive_averages.yearAverages[year] = {
                sum: now.receive_data_amount,
                count: 1
              }
            } else {
              receive_averages.yearAverages[year].sum += now.receive_data_amount ? now.receive_data_amount : 0
              receive_averages.yearAverages[year].count += 1
            }

            if (!transmit_averages.yearAverages[year]) {
              transmit_averages.yearAverages[year] = {
                sum: now.transmit_data_amount,
                count: 1
              }
            } else {
              transmit_averages.yearAverages[year].sum += now.transmit_data_amount ? now.transmit_data_amount : 0
              transmit_averages.yearAverages[year].count += 1
            }
          })

          interface averages {
            sum: number
            count: number
          }

          interface averagesInfo {
            dailyAveragesResult: averages
            monthlyAveragesResult: averages
            yearAveragesResult: averages
          }

          interface averagesResult {
            receive: averagesInfo
            transmit: averagesInfo
          }

          let averagesResult: averagesResult = {
            receive: {
              dailyAveragesResult: { sum: 0, count: 0 },
              monthlyAveragesResult: { sum: 0, count: 0 },
              yearAveragesResult: { sum: 0, count: 0 }
            },
            transmit: {
              dailyAveragesResult: { sum: 0, count: 0 },
              monthlyAveragesResult: { sum: 0, count: 0 },
              yearAveragesResult: { sum: 0, count: 0 }
            }
          }

          // 일/월/연평균 최종계산
          // 수신
          await Object.keys(receive_averages.dailyAverages).map(async key => {
            averagesResult.receive.dailyAveragesResult.sum +=
              receive_averages.dailyAverages[key].sum / receive_averages.dailyAverages[key].count
            averagesResult.receive.dailyAveragesResult.count++
          })
          await Object.keys(receive_averages.monthlyAverages).map(async key => {
            averagesResult.receive.monthlyAveragesResult.sum +=
              receive_averages.monthlyAverages[key].sum / receive_averages.monthlyAverages[key].count
            averagesResult.receive.monthlyAveragesResult.count++
          })
          await Object.keys(receive_averages.yearAverages).map(async key => {
            averagesResult.receive.yearAveragesResult.sum +=
              receive_averages.yearAverages[key].sum / receive_averages.yearAverages[key].count
            averagesResult.receive.yearAveragesResult.count++
          })

          // 송신
          await Object.keys(transmit_averages.dailyAverages).map(async key => {
            averagesResult.transmit.dailyAveragesResult.sum +=
              transmit_averages.dailyAverages[key].sum / transmit_averages.dailyAverages[key].count
            averagesResult.transmit.dailyAveragesResult.count++
          })
          await Object.keys(transmit_averages.monthlyAverages).map(async key => {
            averagesResult.transmit.monthlyAveragesResult.sum +=
              transmit_averages.monthlyAverages[key].sum / transmit_averages.monthlyAverages[key].count
            averagesResult.transmit.monthlyAveragesResult.count++
          })
          await Object.keys(transmit_averages.yearAverages).map(async key => {
            averagesResult.transmit.yearAveragesResult.sum +=
              transmit_averages.yearAverages[key].sum / transmit_averages.yearAverages[key].count
            averagesResult.transmit.yearAveragesResult.count++
          })

          deviceDataAmountObjectCopy[key] = {
            receive: {
              all: sum_receive && !isNaN(sum_receive) ? sum_receive : 0,
              daily:
                averagesResult.receive.dailyAveragesResult.sum && !isNaN(averagesResult.receive.dailyAveragesResult.sum)
                  ? averagesResult.receive.dailyAveragesResult.sum / averagesResult.receive.dailyAveragesResult.count
                  : 0,
              month:
                averagesResult.receive.monthlyAveragesResult.sum &&
                !isNaN(averagesResult.receive.monthlyAveragesResult.sum)
                  ? averagesResult.receive.monthlyAveragesResult.sum /
                    averagesResult.receive.monthlyAveragesResult.count
                  : 0,
              year:
                averagesResult.receive.yearAveragesResult.sum && !isNaN(averagesResult.receive.yearAveragesResult.sum)
                  ? averagesResult.receive.yearAveragesResult.sum / averagesResult.receive.yearAveragesResult.count
                  : 0
            },
            transmit: {
              all: sum_transmit && !isNaN(sum_transmit) ? sum_transmit : 0,
              daily:
                averagesResult.transmit.dailyAveragesResult.sum &&
                !isNaN(averagesResult.transmit.dailyAveragesResult.sum)
                  ? averagesResult.transmit.dailyAveragesResult.sum / averagesResult.transmit.dailyAveragesResult.count
                  : 0,
              month:
                averagesResult.transmit.monthlyAveragesResult.sum &&
                !isNaN(averagesResult.transmit.monthlyAveragesResult.sum)
                  ? averagesResult.transmit.monthlyAveragesResult.sum /
                    averagesResult.transmit.monthlyAveragesResult.count
                  : 0,
              year:
                averagesResult.transmit.yearAveragesResult.sum && !isNaN(averagesResult.transmit.yearAveragesResult.sum)
                  ? averagesResult.transmit.yearAveragesResult.sum / averagesResult.transmit.yearAveragesResult.count
                  : 0
            }
          }
        })
      )

      async function dateByUnitKey(existingData, d, deviceGraphDataFiltered, deviceGraphDataKeyCopy, key) {
        interface pushData {
          product_serial_number: string
          measurement_timestamp: Date
          humidity: number | null
          temperature: number | null
          receive_data_amount: number
          transmit_data_amount: number
          sum_temperature: number | null
          sum_humidity: number | null
          sum_receive_data_amount: number | null
          sum_transmit_data_amount: number | null
        }
        let pushData: pushData = {
          product_serial_number: key,
          measurement_timestamp: new Date(d),
          humidity: null,
          temperature: null,
          receive_data_amount: 0,
          transmit_data_amount: 0,
          sum_temperature: null,
          sum_humidity: null,
          sum_receive_data_amount: null,
          sum_transmit_data_amount: null
        }

        if (selectedGraphUnitKey === 'min') {
          existingData = await deviceGraphDataKeyCopy.filter(
            (item: Device) =>
              new Date(item.measurement_timestamp).getFullYear() === new Date(d).getFullYear() &&
              new Date(item.measurement_timestamp).getMonth() === new Date(d).getMonth() &&
              new Date(item.measurement_timestamp).getDate() === new Date(d).getDate() &&
              new Date(item.measurement_timestamp).getHours() === new Date(d).getHours() &&
              new Date(item.measurement_timestamp).getMinutes() === new Date(d).getMinutes()
          )
        } else if (selectedGraphUnitKey === 'day') {
          existingData = await deviceGraphDataKeyCopy.filter(
            (item: Device) =>
              new Date(item.measurement_timestamp).getFullYear() === new Date(d).getFullYear() &&
              new Date(item.measurement_timestamp).getMonth() === new Date(d).getMonth() &&
              new Date(item.measurement_timestamp).getDate() === new Date(d).getDate()
          )
        } else if (selectedGraphUnitKey === 'mon') {
          existingData = await deviceGraphDataKeyCopy.filter(
            (item: Device) =>
              new Date(item.measurement_timestamp).getFullYear() === new Date(d).getFullYear() &&
              new Date(item.measurement_timestamp).getMonth() === new Date(d).getMonth()
          )
        } else if (selectedGraphUnitKey === 'year') {
          existingData = await deviceGraphDataKeyCopy.filter(
            (item: Device) => new Date(item.measurement_timestamp).getFullYear() === new Date(d).getFullYear()
          )
        }

        // 데이터가 있는 경우
        if (existingData.length) {
          pushData.measurement_timestamp = new Date(existingData[0].measurement_timestamp)
          // 현재 시각의 key에 데이터가 여러개면(배열 형태), 평균값 삽입
          if (existingData.length > 1) {
            const sumTemperature = existingData.reduce((sum: number, currentValue: Device) => {
              return sum + currentValue.temperature
            }, 0)
            pushData.sum_temperature = sumTemperature
            pushData.temperature = sumTemperature / existingData.length

            const sumHumidity = existingData.reduce((sum: number, currentValue: Device) => {
              return sum + currentValue.humidity
            }, 0)
            pushData.sum_humidity = sumHumidity
            pushData.humidity = sumHumidity / existingData.length

            const sumReceiveAmount = existingData.reduce((sum: number, currentValue: Device) => {
              return sum + currentValue.receive_data_amount
            }, 0)
            pushData.sum_receive_data_amount = sumReceiveAmount
            pushData.receive_data_amount = sumReceiveAmount / existingData.length

            const sumTransmitAmount = existingData.reduce((sum: number, currentValue: Device) => {
              return sum + currentValue.transmit_data_amount
            }, 0)
            pushData.sum_transmit_data_amount = sumTransmitAmount
            pushData.transmit_data_amount = sumTransmitAmount / existingData.length
          } else {
            pushData.temperature = existingData[0].temperature
            pushData.humidity = existingData[0].humidity
            pushData.receive_data_amount = existingData[0].receive_data_amount
            pushData.transmit_data_amount = existingData[0].transmit_data_amount
          }
        }
        // 데이터가 없는 경우 : null인 상태로 삽입
        deviceGraphDataFiltered.push(pushData)
      }

      let accumulateObj: any = {}

      await Object.keys(deviceGraphData).map(async key => {
        let deviceGraphDataKeyCopy = [...deviceGraphCopyData[key]]
        const deviceGraphDataFiltered: Array<Device> = []

        if (selectedGraphUnitKey === 'min') {
          for (let d = new Date(startDate); d <= new Date(endDate); d.setMinutes(d.getMinutes() + 1)) {
            // 해당 Date의 데이터 존재 여부 확인 (filter 함수를 사용하여 배열 생성)
            let existingData
            dateByUnitKey(existingData, d, deviceGraphDataFiltered, deviceGraphDataKeyCopy, key)
          }
        } else if (selectedGraphUnitKey === 'day') {
          for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
            // 해당 Date의 데이터 존재 여부 확인 (new Date(endDate) 함수를 사용하여 배열 생성)
            let existingData
            dateByUnitKey(existingData, d, deviceGraphDataFiltered, deviceGraphDataKeyCopy, key)
          }
        } else if (selectedGraphUnitKey === 'mon') {
          for (let d = new Date(startDate); d <= new Date(endDate); d.setMonth(d.getMonth() + 1)) {
            // 해당 Date의 데이터 존재 여부 확인 (filter 함수를 사용하여 배열 생성)
            let existingData
            dateByUnitKey(existingData, d, deviceGraphDataFiltered, deviceGraphDataKeyCopy, key)
          }
        } else if (selectedGraphUnitKey === 'year') {
          for (let d = new Date(startDate); d <= new Date(endDate); d.setFullYear(d.getFullYear() + 1)) {
            // 해당 Date의 데이터 존재 여부 확인 (filter 함수를 사용하여 배열 생성)
            let existingData
            dateByUnitKey(existingData, d, deviceGraphDataFiltered, deviceGraphDataKeyCopy, key)
          }
        }

        await deviceGraphDataFiltered.sort((a: Device, b: Device) => {
          const dateA: any = new Date(a.measurement_timestamp)
          const dateB: any = new Date(b.measurement_timestamp)
          return dateA - dateB
        })

        cumulativeDataCalculator(deviceGraphDataFiltered, key, accumulateObj)

        deviceGraphDataCopy[key] = deviceGraphDataFiltered
      })

      setAccumulateReceiveAndTransmitData(accumulateObj)
      setDeviceGraphData(deviceGraphDataCopy)
      setDeviceDataAmountObject(deviceDataAmountObjectCopy)

      console.log(deviceDataAmountObject)
    }
  }

  // 루트 노드 생성
  const rootNode = new ClusterNode('Root', null, null, [], null)
  // 루트 노드 관리
  const [root, setRoot] = useState(rootNode)

  // 선택한 드롭다운 데이터 관리
  const [selectedCity, setSelectedCity] = useState<string | undefined | string[]>(null)
  const [selectedGu, setSelectedGu] = useState<string | undefined | string[]>()
  const [selectedAddress, setSelectedAddress] = useState<string | undefined | string[]>()
  const [selectedGroup, setSelectedGroup] = useState<string | null>()
  const [selectedLocation, setSelectedLocation] = useState<string | null>()

  // i8 data
  const [deviceDataByClusterKey, setDeviceDataByClusterKey] = useState()

  // selected 변수를 순회하며 null 직전의 값을 얻어냄
  const clusterArray = ['City', 'Gu', 'Address', 'Group', 'Location']

  // image
  const [deviceImage, setDeviceImage] = useState()

  // table check status
  const [tableTransmitStatus, setTableTransmitStatus] = useState<boolean>(false)
  const [tableReceiveStatus, setTableReceiveStatus] = useState<boolean>(false)
  const [tableTransmitAndReceiveStatus, setTableTransmitAndReceiveStatus] = useState<boolean>(false)

  const [tableTemperatureStatus, setTableTemperatureStatus] = useState<boolean>(false)
  const [tableHumidityStatus, setTableHumidityStatus] = useState<boolean>(false)

  // route status
  const [routeStatus, setRouteStatus] = useState<boolean>(false)

  const getDeviceDataByClusterKey = async (requestKey: string | undefined | string[], requestClusterKey: string) => {
    await axios
      .post('/api/data', {
        cluster_name: requestKey,
        cluster_unit: requestClusterKey
      })
      .then(res => {
        const status = res.data.status

        if (status === 'success') {
          const data = res.data.data
          setDeviceDataByClusterKey(data)
        } else {
          console.log('ERROR')
        }
      })
  }

  const changeLocation = async () => {
    let index = -1
    let requestKey

    let tempObj: any = {
      selectedCity,
      selectedGu,
      selectedAddress,
      selectedGroup,
      selectedLocation
    }
    // console.log(tempObj)

    Object.keys(tempObj).map(item => {
      if (tempObj[item]) {
        index++
        requestKey = tempObj[item]
        // console.log(item)
        // console.log(index)
      }
    })

    if (index !== -1) {
      let requestClusterKey = clusterArray[index]
      // console.log(requestClusterKey, requestKey)
      getDeviceDataByClusterKey(requestKey, requestClusterKey)
      setAllDataNode(reqGlobalRootState.findByNodeRecursion(requestKey, reqGlobalRootState)?.findLowestNodes())
    }

    if (selectedGroup && selectedLocation) {
      console.log(selectedGroup, selectedLocation)
      await axios
        .post('/api/device/image', {
          cluster: selectedGroup,
          location: selectedLocation
        })
        .then(response => {
          let res = response.data

          if (res.status === 'success' && res.data !== null) {
            setDeviceImage(res.data)
          } else {
            console.log('fail')
          }
        })

      // setDeviceImage("../../../../../i8-sensor-backend/location_images/동의대 산학협력관-산학101.jpg")
    }
  }

  const onCheckedTableElement = (value: string, checked: boolean) => {
    if (value === '송신량') {
      setTableTransmitStatus(checked)
    } else if (value === '수신량') {
      setTableReceiveStatus(checked)
    } else if (value === '송수신량') {
      setTableTransmitAndReceiveStatus(checked)
    } else if (value === '온도') {
      setTableTemperatureStatus(checked)
    } else if (value === '습도') {
      setTableHumidityStatus(checked)
    }
  }

  useEffect(() => {
    if (!router) return
    if (!router.isReady) return

    getDeviceData()

    if (reqGlobalRootState) {
      setAllDataNode(reqGlobalRootState.getAllNodesAtDepth(reqGlobalRootState, 5))
    }

    // router query로 받은 값을 이용하여 dropdown selected 값 지정
    setSelectedCity(router?.query.selectedCity)
    setSelectedGu(router?.query.selectedGu)
    setSelectedAddress(router?.query.selectedAddress)

    // '설치 위치' -> '설치 장소' 이동하여 접속한 경우
    if (router.query.hasOwnProperty('selectedCity')) {
      setSelectedGroup(null)
      setSelectedLocation(null)

      // cluster 단위 (시, 구, ...)
      let requestClusterKey: string
      // cluster 이름 (부산, 서울, ...)
      let requestKey: string | undefined | string[]
      let requestDepth: number
      let index = 0

      for (let key of Object.keys(router.query)) {
        const requestKeyName: string | undefined | string[] = router.query[key]

        if (requestKeyName) {
          requestKey = requestKeyName
          requestClusterKey = clusterArray[index]
          requestDepth = index + 1
        }
        index++
      }

      getDeviceDataByClusterKey(requestKey, requestClusterKey)
      setAllDataNode(reqGlobalRootState.findByNodeRecursion(requestKey, reqGlobalRootState)?.findLowestNodes())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, deviceData, root, reqGlobalRootState])

  useEffect(() => {
    if (!selectedCity) setSelectedCity('서울')

    const stDate: Date = new Date()
    const edDate: Date = new Date()
    edDate.setDate(stDate.getDate() - 14)
    setEndDate(stDate)
    setStartDate(edDate)
    // changeLocation();
  }, [selectedCity, routeStatus, selectedGu, selectedAddress, selectedGroup, selectedLocation])

  return (
    <React.Fragment>
      <div className='flex items-start justify-center m-4' style={{ maxHeight: '1200px' }}>
        {/* left */}
        <Box className='w-2/3 m-1' sx={{ width: '66%', m: 1, minWidth: '700px' }}>
          <Card>
            <CardHeader title='설치 정보 변경'></CardHeader>
            {/* info */}
            <div className='flex items-start justify-between p-5 flex-col'>
              <div className='flex flex-row'>
                <b>설치 장소명</b> :
                <div className='flex ml-3 flex-col'>
                  <div className='flex'>
                    {/* 시 단위 */}
                    <SelectDropDown
                      selectedItem={selectedCity}
                      setSelectedItem={setSelectedCity}
                      setSelectedItemKey={setSelectedGu}
                      data={reqGlobalRootState?.children}
                    />

                    {/* 구 단위 */}
                    <SelectDropDown
                      selectedItem={selectedGu}
                      setSelectedItem={setSelectedGu}
                      setSelectedItemKey={setSelectedAddress}
                      data={reqGlobalRootState.findChildNodeByName(selectedCity)?.children}
                    />

                    {/* 시 단위 누르면 구, 주소, 그룹, 장소 선택한 거 초기화되게. */}
                    {/* 주소 단위 */}
                    <SelectDropDown
                      selectedItem={selectedAddress}
                      setSelectedItem={setSelectedAddress}
                      setSelectedItemKey={setSelectedGroup}
                      data={
                        selectedGu
                          ? reqGlobalRootState.findByNodeRecursion(selectedGu, reqGlobalRootState).children
                          : []
                      }
                    />
                  </div>
                  <div className='flex'>
                    {/* 그룹 단위 */}
                    <SelectDropDown
                      selectedItem={selectedGroup}
                      setSelectedItem={setSelectedGroup}
                      setSelectedItemKey={setSelectedLocation}
                      data={
                        selectedAddress
                          ? reqGlobalRootState.findByNodeRecursion(selectedAddress, reqGlobalRootState).children
                          : []
                      }
                    />
                    {/* 장소 단위 */}
                    <SelectDropDown
                      selectedItem={selectedLocation}
                      setSelectedItem={setSelectedLocation}
                      setSelectedItemKey={setSelectedAddress}
                      data={
                        selectedGroup
                          ? reqGlobalRootState.findByNodeRecursion(selectedGroup, reqGlobalRootState).children
                          : []
                      }
                    />
                  </div>
                </div>
                <Box sx={{ ml: 5 }}>
                  <Button
                    onClick={() => changeLocation()}
                    className='self-end'
                    color='gray'
                    style={{ border: '1px solid rgb(160, 160, 160)' }}
                  >
                    변경
                  </Button>
                </Box>
              </div>
              <Box sx={{ mt: 3 }}>
                <b>설치 제품명</b>: I8-SENSOR
              </Box>
              <div className='mt-2'>
                <b>설치 기기 수</b>: {allDataNode ? allDataNode.length : null}
              </div>
            </div>
          </Card>

          <Card sx={{ mt: 3, p: 2 }}>
            <div className='flex p-3 justify-between'>
              {/* graph drop-down */}
              <div className='flex items-center'>
                <b className='mr-3'>장소 정보: </b>
                <SelectDropDown
                  setGraphMessage={setGraphMessage}
                  selectedItem={selectedGraph}
                  setSelectedItem={setSelectedGraph}
                  setSelectedItemKey={setSelectedGraphKey}
                  data={[
                    '온도 그래프',
                    '습도 그래프',
                    '데이터 사용량 그래프',
                    '기기 위치',
                    '누적/평균 데이터량 조회',
                    '통합 데이터 조회'
                  ]}
                  keyData={['temperature', 'humidity', 'data_amount', '', '', '']}
                  graph={true}
                  graph2={true}
                />
              </div>

              {/* 단위 (분, 일, 월, 년) */}
              <div className='flex items-center'>
                <b className='mr-3'>단위: </b>
                <SelectDropDown
                  selectedItem={selectedGraphUnit}
                  setSelectedItem={setSelectedGraphUnit}
                  setSelectedItemKey={setSelectedGraphUnitKey}
                  data={selectedGraphKey === 'data_amount' ? ['일', '월', '년'] : ['분', '일', '월', '년']}
                  keyData={selectedGraphKey === 'data_amount' ? ['day', 'mon', 'year'] : ['min', 'day', 'mon', 'year']}
                  graph={true}
                  graph2={false}
                />
              </div>
            </div>

            {/* 기간 설정 */}
            <div>
              <span className='px-3 font-semibold'>기간 설정</span>
            </div>
            <div className='w-full flex items-center justify-start' style={{ position: 'relative' }}>
              <div>
                <DateRange setDate={setStartDate} date={startDate} />
              </div>
              <div>
                <span>~</span>
              </div>
              <div>
                <DateRange setDate={setEndDate} date={endDate} />
              </div>

              <div className='flex gap-3'>
                <Button color='gray' onClick={() => triggerSearchGraphDataBySelectedDate()}>
                  🔍 검색
                </Button>
              </div>
              {/* {selectedGraph==="" ? <div style={{width: '100%', height: '500%', border: '1px solid black', position: 'absolute', top: '50px'}}>데이터를 선택해주세요</div>:  null}                */}

              {selectedGraph === '누적/평균 데이터량 조회' ? (
                <div className='flex gap-3'>
                  <div className='ml-3 flex gap-1 items-center'>
                    <input
                      type='checkbox'
                      value={'송신량'}
                      onChange={e => onCheckedTableElement(e.target.value, e.target.checked)}
                    />
                    <span>송신량</span>
                  </div>
                  <div className='flex gap-1 items-center'>
                    <input
                      type='checkbox'
                      value={'수신량'}
                      onChange={e => onCheckedTableElement(e.target.value, e.target.checked)}
                    />
                    <span>수신량</span>
                  </div>
                  <div className='flex gap-1 items-center'>
                    <input
                      type='checkbox'
                      value={'송수신량'}
                      onChange={e => onCheckedTableElement(e.target.value, e.target.checked)}
                    />
                    <span>송수신량</span>
                  </div>
                </div>
              ) : null}

              {selectedGraph === '통합 데이터 조회' ? (
                <div className='flex gap-3'>
                  <div className='ml-3 flex gap-1 items-center'>
                    <input
                      type='checkbox'
                      value={'온도'}
                      onChange={e => onCheckedTableElement(e.target.value, e.target.checked)}
                    />
                    <span>온도</span>
                  </div>
                  <div className='ml-3 flex gap-1 items-center'>
                    <input
                      type='checkbox'
                      value={'습도'}
                      onChange={e => onCheckedTableElement(e.target.value, e.target.checked)}
                    />
                    <span>습도</span>
                  </div>
                  <div className='ml-3 flex gap-1 items-center'>
                    <input
                      type='checkbox'
                      value={'송신량'}
                      onChange={e => onCheckedTableElement(e.target.value, e.target.checked)}
                    />
                    <span>송신량</span>
                  </div>
                  <div className='flex gap-1 items-center'>
                    <input
                      type='checkbox'
                      value={'수신량'}
                      onChange={e => onCheckedTableElement(e.target.value, e.target.checked)}
                    />
                    <span>수신량</span>
                  </div>
                </div>
              ) : null}

              {selectedGraph === '데이터 사용량 그래프' ? (
                <div className='flex gap-3 p-3'>
                  <div className='flex items-center'>
                    <input
                      checked={selectedDataAmountUnitKey === 'average_data_amount' ? true : false}
                      onClick={() => setSelectedDataAmountUnitKey('average_data_amount')}
                      id='average-data-amount'
                      type='radio'
                      value=''
                      name='default-radio'
                      className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 
                                            hover:cursor-pointer
                                            focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'
                    />
                    <label
                      for='average-data-amount'
                      className='ms-2 text-sm font-medium text-gray-900 dark:text-gray-300'
                    >
                      평균 사용량
                    </label>
                  </div>

                  <div className='flex items-center'>
                    <input
                      checked={selectedDataAmountUnitKey === 'accumulate_data_amount' ? true : false}
                      onClick={() => setSelectedDataAmountUnitKey('accumulate_data_amount')}
                      id='accumulate-data-amount'
                      type='radio'
                      value=''
                      name='default-radio'
                      className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 
                                            hover:cursor-pointer
                                            focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'
                    />
                    <label
                      for='accumulate-data-amount'
                      className='ms-2 text-sm font-medium text-gray-900 dark:text-gray-300'
                    >
                      누적 사용량
                    </label>
                  </div>
                </div>
              ) : null}
            </div>

            <div className='text-blue-500 mb-3 text-center text-sm'>{searchGraphDataBySelectedDateStatus}</div>

            {/* 선택 화면 */}
            <Card sx={{ width: '100%', height: '100%', p: 5, position: 'relative' }}>
              <Box sx={{ position: 'absolute', top: '40%', width: '100%', fontSize: '30px', textAlign: 'center' }}>
                {graphMessage}
              </Box>
              {selectedGraph === '누적/평균 데이터량 조회' ? (
                <DataAmountToCSV
                  deviceGraphData={deviceGraphData}
                  deviceGraphCopyData={deviceGraphCopyData}
                  checkedClusterName={checkedClusterName}
                  selectedGraph={selectedGraph}
                  selectedGraphKey={selectedGraphKey}
                  tableTransmitStatus={tableTransmitStatus}
                  tableReceiveStatus={tableReceiveStatus}
                  tableTransmitAndReceiveStatus={tableTransmitAndReceiveStatus}
                  deviceDataAmountObject={deviceDataAmountObject}
                />
              ) : selectedGraph === '기기 위치' ? (
                selectedLocation ? (
                  <StickerTest
                    graphCount={graphCount}
                    deviceGraphData={deviceGraphData}
                    deviceImage={deviceImage}
                    deviceGraphCopyData={deviceGraphCopyData}
                  />
                ) : (
                  <div
                    className='w-[800px] h-[600px] bg-gray-300
                                        flex justify-center items-center'
                  >
                    <div className='text-xl font-semibold text-gray-700'>장소명을 선택해 주세요.</div>
                  </div>
                )
              ) : selectedGraph === '통합 데이터 조회' ? (
                <AllDataToCSV
                  deviceGraphData={deviceGraphData}
                  deviceGraphCopyData={deviceGraphCopyData}
                  tableTemperatureStatus={tableTemperatureStatus}
                  tableHumidityStatus={tableHumidityStatus}
                  tableTransmitStatus={tableTransmitStatus}
                  tableReceiveStatus={tableReceiveStatus}
                />
              ) : (
                <Graph
                  deviceGraphData={deviceGraphData}
                  checkedClusterName={checkedClusterName}
                  selectedGraph={selectedGraph}
                  selectedGraphKey={selectedGraphKey}
                  selectedGraphUnitKey={selectedGraphUnitKey}
                  startDate={startDate}
                  endDate={endDate}
                  selectedDataAmountUnitKey={selectedDataAmountUnitKey}
                  dataAmountData={accumulateReceiveAndTransmitData}
                />
              )}
            </Card>
          </Card>
        </Box>

        {/* right */}
        <Card className='w-1/3 m-1' sx={{ width: '33%', m: 1, ml: 2, minWidth: '400px' }}>
          <Box>
            <CardHeader title={`기기 리스트`}></CardHeader>
            <Box sx={{ ml: 5, fontWeight: 600, mb: 2 }}>총 기기 수 : {allDataNode ? allDataNode?.length : null}대</Box>
          </Box>

          <CardContent className='max-h-[920px] overflow-y-scroll'>
            {allDataNode?.map((item: ClusterNode, index) => {
              if (deviceDataByClusterKey) {
                let data = deviceDataByClusterKey.filter(
                  item_ => item_.product_serial_number === item.product_serial_number
                )

                data.sort((a: Device, b: Device) => {
                  const dateA: any = new Date(a.measurement_timestamp)
                  const dateB: any = new Date(b.measurement_timestamp)
                  return dateA - dateB
                })

                // 불쾌지수 계산
                let currentData = data.slice(-2, -1)
                if (currentData.length) {
                  var discomfort: number =
                    (9 / 5) * currentData.temperature -
                    0.55 * (1 - currentData.humidity / 100) * ((9 / 5) * currentData.temperature - 26) +
                    32
                  var discomfortString: string | null = ''
                  var discomfortSrc: string | null = ''
                  var discomfortColor: string | null = ''

                  if (discomfort < 68) {
                    discomfortString = ' 낮음'
                    discomfortSrc = '/img/gauge-low.png'
                    discomfortColor = 'text-green-500'
                  } else if (discomfort <= 75) {
                    discomfortString = ' 보통'
                    discomfortSrc = '/img/gauge-common.png'
                    discomfortColor = 'text-orange-500'
                  } else if (discomfort <= 80) {
                    discomfortString = ' 높음'
                    discomfortSrc = '/img/gauge-high.png'
                    discomfortColor = 'text-yellow-500'
                  } else if (discomfort > 80) {
                    discomfortString = ' 매우높음'
                    discomfortSrc = '/img/gauge-extreme.png'
                    discomfortColor = 'text-red-500'
                  } else {
                    discomfortString = null
                    discomfortSrc = null
                    discomfortColor = null
                  }
                }
              }

              return (
                <>
                  <div
                    className='border border-1 border-gray-400 rounded-md p-3 my-2
                                    flex justify-between items-center'
                  >
                    {/* description */}
                    <div className='flex items-center'>
                      <span content='기기 선택은 5개까지 가능합니다.'>
                        <input
                          type='checkbox'
                          className='hover:cursor-pointer mr-3'
                          value={item.product_serial_number}
                          id={`device-${index}`}
                          onChange={e => onCheckedElement(e.target, e.target.checked, e.target.value)}
                        ></input>
                      </span>
                      <span>
                        <div>
                          <b>제품명</b>: I8_SENSOR
                        </div>

                        <div>
                          <b>cluster</b>: {item.addressData}
                        </div>
                        <div>
                          <b>location</b>: {item.name}
                        </div>
                        <div>
                          <b>S/N</b>: {item.product_serial_number}
                        </div>
                        <div>
                          <b>센서 정보</b>: 온/습도
                        </div>
                      </span>
                    </div>

                    {/* 불쾌지수 */}
                    <div className='flex flex-col items-center justify-center'>
                      {discomfortSrc ? (
                        <React.Fragment>
                          <Image src={discomfortSrc} width={60} height={20} alt={`${item.product_serial_number}`} />
                          <div className='text-sm text-center'>
                            불쾌지수
                            <div className={`${discomfortColor} font-semibold`}>{discomfortString}</div>
                          </div>
                        </React.Fragment>
                      ) : null}
                    </div>
                  </div>
                </>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </React.Fragment>
  )
}
