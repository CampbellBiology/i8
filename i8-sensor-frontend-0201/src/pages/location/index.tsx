import axios from 'axios'
import React, { useEffect, useState } from 'react'

// import * as turf from '@turf/turf'
import Image from 'next/image'
import { Accordion, AccordionBody, AccordionHeader, AccordionItem } from 'react-headless-accordion'
import Map_ from './map'
import 'tailwindcss/tailwind.css'

// flowbite
import { Badge, Button } from 'flowbite-react'

// components

import { useRouter } from 'next/router'

// state of recoil
import { globalRootState } from '../state'
import { useSetRecoilState, useRecoilValue } from 'recoil'
import SearchAddress from '../register/SearchAddress'

declare global {
  interface Window {
    kakao: any
  }
}

interface Coordinate {
  La: number
  Ma: number
}

interface Device {
  product_serial_number: string
  address: string
  cluster: string
  location: string
}

// ClusterNode 클래스 정의
export class ClusterNode {
  name: string | null
  addressData: string | null
  children: ClusterNode[]
  depth: number | null
  coordinate: Array<Coordinate>
  product_serial_number: string | null

  // 생성자
  constructor(
    name: string | null,
    addressData: string | null,
    depth: number | null,
    coordinate: Array<Coordinate>,
    product_serial_number: string | null
  ) {
    this.name = name // 클러스터 노드의 이름 초기화
    this.addressData = addressData // 데이터 (미정)
    this.children = [] // 하위 노드들을 저장할 빈 배열 초기화
    this.depth = depth // 현재 깊이
    this.coordinate = coordinate
    this.product_serial_number = product_serial_number
  }

  // 자식 노드 추가 함수
  addChild(child: ClusterNode) {
    this.children.push(child) // 주어진 자식 노드를 배열에 추가
  }

  // 주어진 이름을 가진 자식 노드를 찾는 함수
  findChildNodeByName(name: string): ClusterNode | null {
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i].name === name) {
        // console.log(this.children[i].name, name)
        // console.log(this.children[i])
        return this.children[i] // 이름이 일치하는 자식 노드 반환
      }
    }

    return null // 일치하는 자식 노드가 없는 경우 null 반환
  }

  // 특정 클러스터에 접근하고, 하위 노드 탐색할 수 있는 함수
  findNodeByName(findArray: Array<string>): ClusterNode {
    let foundNode: ClusterNode = null
    let startNodeName = findArray[0]

    // root node를 findArray의 0번째 요소로 초기화
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i].name === startNodeName) {
        foundNode = this.children[i] // 이름이 일치하는 자식 노드 반환
        break
      }
    }

    // findArray의 1번째 요소부터 노드로 선택하여 탐색
    for (let i = 1; i < findArray.length; i++) {
      let nowName = findArray[i]

      for (let j = 0; j < foundNode.children.length; j++) {
        // 이름이 일치하는 자식 노드를 찾음
        if (foundNode.children[j].name === nowName) {
          foundNode = foundNode.children[j]
          break
        }
      }
    }

    if (!foundNode) return null // 일치하는 자식 노드가 없는 경우 null 반환
    else return foundNode
  }

  // 가장 하위 노드들을 찾는 함수 -> 개수 구할 때 사용
  findLowestNodes(): Array<ClusterNode> {
    let lowestNodes: ClusterNode[] = []

    const traverse = (node: ClusterNode) => {
      // 자식이 없으면 최하위 노드인 것 -> 배열에 추가하여 count
      if (node.children.length === 0) {
        lowestNodes.push(node)
      } else {
        // 자식이 존재하면, 현재 노드의 자식 노드를 탐색 -> 재귀 탐색
        for (let i = 0; i < node.children.length; i++) {
          traverse(node.children[i])
        }
      }
    }

    // 재귀 탐색
    traverse(this)

    return lowestNodes
  }

  // 노드를 매개변수로 받아 현재 깊이를 반환하는 함수
  getDepth(): number | null {
    return this.depth
  }

  // 특정 depth의 모든 노드를 배열로 가져오는 함수
  getAllNodesAtDepth(root: ClusterNode, targetDepth: number): ClusterNode[] {
    let nodes: ClusterNode[] = []

    const traverse = (node: ClusterNode, currentDepth: number) => {
      if (currentDepth === targetDepth) {
        nodes.push(node)
      } else {
        for (let i = 0; i < node.children.length; i++) {
          traverse(node.children[i], currentDepth + 1)
        }
      }
    }

    traverse(root, 0)

    return nodes
  }

  // 특정 노드를 매개변수로 받아 해당 노드를 갖고 있는 부모 노드를 반환하는 함수
  findParentNodeContainingNode(targetNode: ClusterNode, root: ClusterNode): ClusterNode | null {
    let parentNode: ClusterNode | null = null

    const traverse = (node: ClusterNode, target: ClusterNode) => {
      if (node.children.includes(target)) {
        parentNode = node
      } else {
        for (let i = 0; i < node.children.length; i++) {
          traverse(node.children[i], target)
        }
      }
    }

    traverse(root, targetNode)

    return parentNode
  }

  // 특정 노드 배열을 매개변수로 받아 해당 배열의 각 요소 노드를 자식 노드로 갖고 있는 부모 노드의 배열을 반환하는 함수
  findParentNodesContainingNodes(targetNodes: ClusterNode[], root: ClusterNode): ClusterNode[] {
    let parentNodes: ClusterNode[] = []

    const traverse = (node: ClusterNode, targets: ClusterNode[]) => {
      for (let i = 0; i < node.children.length; i++) {
        if (targets.includes(node.children[i])) {
          if (!parentNodes.includes(node)) parentNodes.push(node)
        }
        traverse(node.children[i], targets)
      }
    }

    for (let i = 0; i < targetNodes.length; i++) {
      traverse(root, targetNodes)
    }

    return parentNodes
  }

  // 특정 name을 가진 노드를 찾아서 그 노드의 coordinate 값을 변경하고 변경사항을 저장하는 함수
  findAndUpdateCoordinate(name: string, newCoordinate: Array<Coordinate>, root: ClusterNode) {
    const findAndModify = (node: ClusterNode) => {
      if (node.name === name) {
        node.coordinate = newCoordinate // coordinate 값 변경
      } else {
        for (let i = 0; i < node.children.length; i++) {
          findAndModify(node.children[i])
        }
      }
    }

    findAndModify(root)
  }

  // 특정 노드를 시작 루트로 잡고, 특정 name을 가진 노드를 찾아내는 함수
  findByNodeRecursion(name: string, root: ClusterNode) {
    let result

    const recursion = (node: ClusterNode) => {
      if (node.name === name) {
        result = node
        // console.log(root)
        // return root;
      } else {
        for (let i = 0; i < node.children.length; i++) {
          recursion(node.children[i])
        }
      }
    }

    recursion(root)
    return result
  }
}

export default function LocationPage() {
  const router = useRouter()

  const [addressOpen, setAddressOpen] = useState<boolean>(false) // 주소검색 오픈
  const [addressDetail, setAddressDetail] = useState<string>('') // 자세한 주소 입력칸
  const [triggerMap, setTriggerMap] = useState<boolean>(false)

  const [deviceData, setDeviceData] = useState<Array<Device>>([])

  const [selectedCircleName, setSelectedCircleName] = useState<string>('')

  const getDeviceInfo = async () => {
    await axios
      .get('/api/device', {
        withCredentials: true
      })
      .then(async response => {
        let res = response.data

        if (res.status === 'success') {
          if (!deviceData.length) setDeviceData(res.data)
        }
      })
  }

  // 루트 노드 생성
  const rootNode = new ClusterNode('Root', null, null, [], null)
  // 루트 노드 관리
  const [root, setRoot] = useState(rootNode)
  // 탐색용 노드 (루트 노드 복사본)
  const [rootCopy, setRootCopy] = useState(rootNode)
  // 특정 depth의 노드 배열
  const [nodeArrayAtDepth, setNodeArrayAtDepth] = useState(rootNode)
  // 루트 노드의 자식 관리
  const [childRoot, setChildRoot] = useState<Array<ClusterNode>>([])

  // 루트를 전역으로 관리
  const reqGlobalRootState: ClusterNode = useRecoilValue(globalRootState)
  const setReqGlobalRootState = useSetRecoilState(globalRootState)

  // Device 노드 추가
  const addAddress = (array: string[], addressData: string, product_serial_number: string) => {
    let currentNode = rootNode // 현재 노드를 루트 노드로 초기화

    // 주어진 주소 배열을 순회하며 클러스터링
    for (let i = 0; i < array.length; i++) {
      const address = array[i]
      let foundChild = false

      // 현재 노드의 자식 노드들을 확인하여 주소와 일치하는 노드가 있는지 확인
      for (let j = 0; j < currentNode.children.length; j++) {
        if (currentNode.children[j].name === address) {
          currentNode = currentNode.children[j] // 일치하는 자식 노드로 이동
          foundChild = true
          break
        }
      }

      // 일치하는 자식 노드가 없는 경우 새로운 노드를 생성하여 추가
      if (!foundChild) {
        const newNode = new ClusterNode(address, addressData, i, null, product_serial_number)
        currentNode.addChild(newNode)
        currentNode = newNode
      }
    }

    // 루트 노드 업데이트
    setRoot(rootNode)
    setNodeArrayAtDepth(rootNode)
    setRootCopy(rootNode)
  }

  // 하위 클러스터를 찾는 함수
  const findSubClusters = (parentNode: ClusterNode) => {
    for (let i = 0; i < parentNode.children.length; i++) {
      const childNode = parentNode.children[i]
      // 각 하위 클러스터에 대한 작업 수행
      // console.log(childNode.name);
    }
  }

  // 루트 재구성
  const changeRoot = (prevRoot: ClusterNode, nodeName: string | null, changeRoot: boolean) => {
    if (!nodeName) return
    const foundNode: ClusterNode = prevRoot.findNodeByName([nodeName])
    findSubClusters(foundNode)

    if (changeRoot) {
      setRoot(foundNode)
    }
  }

  // info page로 이동
  const moveToInfoFromRoot = (node: ClusterNode) => {
    // depth는 1부터 시작
    const depth = node.depth ? node.depth + 1 : 1

    // router push func
    const move = (query: any) => {
      router.push({
        pathname: '/sensor/info',
        query: query
      })
    }

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

    // depth 1 : selectedCity 변경, 나머지는 null
    if (depth === 1) {
      move(queryObject(node.name, null, null, null, null))
    }

    // depth 2 : selectedGu까지 변경, 나머지는 null
    if (depth === 2) {
      const parentsNode: ClusterNode | null = node.findParentNodeContainingNode(node, rootCopy)

      move(queryObject(parentsNode?.name, node.name, null, null, null))
    }

    // depth 3 : selectedAddress까지 변경, 나머지는 null
    if (depth === 3) {
      const parentsNode: ClusterNode | null = node.findParentNodeContainingNode(node, rootCopy)
      const parentsNode_: ClusterNode | null | undefined = parentsNode?.findParentNodeContainingNode(
        parentsNode,
        rootCopy
      )

      move(queryObject(parentsNode_?.name, parentsNode?.name, node.name, null, null))
    }
  }

  useEffect(() => {
    setTriggerMap(true)
    getDeviceInfo()

    if (deviceData.length) {
      deviceData?.map((item: Device) => {
        if (item.address) {
          let dataArray = [
            item.address.split(' ')[0],
            item.address.split(' ')[1],
            item.address,
            item.cluster,
            item.location
          ]

          addAddress(dataArray, item.address, item.product_serial_number)
        }
      })

      setReqGlobalRootState(root)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerMap, deviceData])

  return (
    <React.Fragment>
      <div>
        <div className='w-30'>
          {Array.isArray(nodeArrayAtDepth)
            ? nodeArrayAtDepth.map(item => {
                return <span key={item.name}>{item.name}</span>
              })
            : null}
        </div>
      </div>

      <div className='flex items-start justify-center m-5'>
        {/* left */}
        <div className='w-2/3 border border-1 border-black p-2'>
          {/* title */}
          <div className='mb-1'>
            <span className='text-xl font-semibold'>설치 장소</span>
          </div>
          <hr />
          {/* search */}
          <div>
            <div className='flex py-2 px-1 justify-start items-center'>
              <Button color='gray' onClick={() => setAddressOpen(true)}>
                주소 검색
              </Button>
              <div className='mx-2'>{addressDetail}</div>
            </div>
          </div>

          {addressOpen ? <SearchAddress setAddressDetail={setAddressDetail} setAddressOpen={setAddressOpen} /> : null}

          {/* <Map_
            root={root}
            setRoot={setRoot}
            nodeArrayAtDepth={nodeArrayAtDepth}
            setNodeArrayAtDepth={setNodeArrayAtDepth}
            rootCopy={rootCopy}
            setRootCopy={setRootCopy}
            addressDetail={addressDetail}
            selectedCircleName={selectedCircleName}
            setSelectedCircleName={setSelectedCircleName}
          /> */}
        </div>

        {/* right */}
        <div className='w-1/3 ml-2 border border-1 border-black p-2' style={{ minWidth: '400px' }}>
          {/* title */}
          <div className='mb-1'>
            <span className='text-xl font-semibold'>설치 장소 리스트</span>
          </div>
          <hr />

          <div>
            {root?.children.map((item: ClusterNode) => {
              const childRoot = root.findNodeByName([item.name])

              return (
                <Accordion key={item.name}>
                  <AccordionItem>
                    {({ open }: any) => (
                      <div>
                        <AccordionHeader className='text-left'>
                          <div
                            className={`border border-1 border-black rounded-md mx-1 my-2 p-2 bg-white`}
                            style={{ width: '100%', minWidth: '320px', border: '1px solid rgb(150, 150, 150)' }}
                            onClick={e => {
                              e.preventDefault()
                              setAddressDetail(item.addressData)
                              setSelectedCircleName(item.name)
                            }}
                          >
                            {selectedCircleName === item.name ? (
                              <div className='flex justify-start items-center'>
                                <Badge color='gray'>✅ 선택됨</Badge>
                              </div>
                            ) : null}
                            {/* root info */}
                            <div className='flex items-center justify-between'>
                              <div>
                                <b>설치 주소</b> : {item.name} | depth: {item.depth}
                              </div>
                              <Image
                                alt='arrow_circle_right'
                                src={'/img/arrow_circle_right.svg'}
                                width={30}
                                height={30}
                                className='hover:scale-110'
                                onClick={() => moveToInfoFromRoot(item)}
                              />
                            </div>
                            <div>
                              <b>설치 제품명</b> : I8-SENSOR
                            </div>
                            <div>
                              <b>설치 기기 수</b> : {item.findLowestNodes().length}대
                            </div>

                            {/* child info */}
                            <AccordionBody>
                              {childRoot.children.map((item_: ClusterNode) => {
                                const childRoot = root.findNodeByName([item.name])

                                return (
                                  <div key={item_.name}>
                                    {item_.depth && item_.depth < 3 ? (
                                      <div
                                        className='border border-1 border-black rounded-md mx-1 my-2 p-2 bg-white'
                                        style={{ border: '1px solid rgb(150, 150, 150)' }}
                                        onClick={() => changeRoot(childRoot, item_.name, true)}
                                      >
                                        <div>
                                          <b>설치 주소</b> : {item_.name} | depth: {item_.depth}
                                        </div>
                                        <div>
                                          <b>설치 제품명</b> : I8-SENSOR
                                        </div>
                                        <div>
                                          <b>설치 기기 수</b> : {item_.findLowestNodes().length}대
                                        </div>
                                      </div>
                                    ) : (
                                      <Accordion>
                                        <AccordionItem>
                                          {({ open }: any) => (
                                            <div>
                                              <AccordionHeader onClick={e => e.stopPropagation()} className='text-left'>
                                                <div
                                                  className='border border-1 border-black rounded-md mx-1 my-2 p-2 bg-white flex items-center justify-between'
                                                  onClick={() => changeRoot(childRoot, item_?.name, true)}
                                                >
                                                  <div>
                                                    <b>설치 주소</b> : {item_.name} | depth: {item_.depth}
                                                  </div>
                                                  <div>
                                                    <b>설치 제품명</b> : I8-SENSOR
                                                  </div>
                                                  <div>
                                                    <b>설치 기기 수</b> : {item_.findLowestNodes().length}대
                                                  </div>
                                                  <AccordionBody>
                                                    <div>
                                                      {childRoot.children[0].children.map((item__, idx) => {
                                                        return (
                                                          <div
                                                            className='border border-1 border-black rounded-md mx-1 my-2 p-2 bg-white'
                                                            key={item__.name}
                                                            style={{ display: 'flex', flexDirection: 'column' }}
                                                            onClick={() => changeRoot(childRoot, item__.name, false)}
                                                          >
                                                            <div>
                                                              <b>설치 주소</b> : {item__.name} | depth: {item__.depth}
                                                            </div>
                                                            <div>
                                                              <b>설치 제품명</b> : I8-SENSOR
                                                            </div>
                                                            <div>
                                                              <b>설치 기기 수</b> : {item__.findLowestNodes().length}대
                                                            </div>
                                                          </div>
                                                        )
                                                      })}
                                                    </div>
                                                  </AccordionBody>

                                                  {/* arrow */}
                                                  <div
                                                    className='bg-gray-200 h-5 -mx-2 mt-1 -mb-2 -p-2 rounded-b-md
                                                                                                                                hover:cursor-pointer hover:brightness-90
                                                                                                                                flex justify-center items-center'
                                                  >
                                                    {open ? (
                                                      <Image alt='up' src='/img/arrow_up.svg' width={30} height={30} />
                                                    ) : (
                                                      <Image
                                                        alt='down'
                                                        src='/img/arrow_down.svg'
                                                        width={30}
                                                        height={30}
                                                      />
                                                    )}
                                                  </div>
                                                </div>
                                              </AccordionHeader>
                                            </div>
                                          )}
                                        </AccordionItem>
                                      </Accordion>
                                    )}
                                  </div>
                                )
                              })}
                            </AccordionBody>

                            {/* arrow */}
                            <div
                              className='bg-gray-200 h-5 -mx-2 mt-1 -mb-2 -p-2 rounded-b-md
                                                                hover:cursor-pointer hover:brightness-90
                                                                flex justify-center items-center'
                            >
                              {open ? (
                                <Image alt='up' src='/img/arrow_up.svg' width={30} height={30} />
                              ) : (
                                <Image alt='down' src='/img/arrow_down.svg' width={30} height={30} />
                              )}
                            </div>
                          </div>
                        </AccordionHeader>
                      </div>
                    )}
                  </AccordionItem>
                </Accordion>
              )
            })}
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}
