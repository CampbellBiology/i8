import { atom } from 'recoil';
import { ClusterNode } from '../pages/sensor/location/index';

interface Device {
    address: string
    product_serial_number: string
    cluster: string
}

interface deviceCluster {
    [key: string]: Array<Device>
}

export interface DeviceClusterInfo {
    "large": deviceCluster,
    "small": deviceCluster,
    "group": deviceCluster,
    "address": deviceCluster,
}


//recoil state 생성
export const deviceClusterInfoState = atom<DeviceClusterInfo>({
    key: 'device_cluster_info',
    default: {
        "large": [],
        "small": [],
        "group": [],
        "address": [],
    }
});

export const deviceClusterCoordinatesState = atom<Array<Array<Array<Number>>>>({
    key: 'device_cluster_coordinates',
    default: []
});

export const geocoder_ = atom<any>({
    key: 'geocoder',
    default: null
})

export const globalRootState = atom<ClusterNode>({
    key: 'globalRoot',
    default: null
})

export const DeviceListState = atom({
    key: 'DeviceListState',
    default: []
})

export const DeviceFilteredListState = atom({
    key: 'DeviceFilteredListState',
    default: []
})


export const MapLevelState = atom({
    key: 'MapLevelState',
    default: 13
})
