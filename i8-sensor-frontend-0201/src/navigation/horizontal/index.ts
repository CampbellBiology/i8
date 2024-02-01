// ** Type import
import { HorizontalNavItemsType } from 'src/@core/layouts/types'

const navigation = (): HorizontalNavItemsType => [
  // {
  //   title: 'Home',
  //   path: '/home',
  //   icon: 'mdi:home-outline'
  // },
  {
    title: '기기 등록',
    path: '/register',
    icon: 'mdi-file-plus'
  },
  {
    title: '기기 위치',
    path: '/location-new',
    icon: 'mdi-map'
  },
  {
    title: '데이터 센터',
    path: '/info',
    icon: 'mdi-chart-bar'
  }
]

export default navigation
