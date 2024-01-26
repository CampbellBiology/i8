// ** Type import
import { HorizontalNavItemsType } from 'src/@core/layouts/types'

const navigation = (): HorizontalNavItemsType => [
  {
    title: 'Home',
    path: '/home',
    icon: 'mdi:home-outline',
  },
  {
    title: '기기 등록',
    path: '/register',
    icon: 'mdi:email-outline',
  },
  {
    title: '기기 위치',
    path: '/location',
    icon: 'mdi:email-outline',
  },
  {
    title: '기기 위치(NEW)',
    path: '/location-new',
    icon: 'mdi:email-outline',
  },
  {
    title: '데이터 센터',
    path: '/info',
    icon: 'mdi:email-outline',
  },
]

export default navigation
