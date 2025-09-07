export interface NavItem { title: string; href: string }
export interface NavCategory { label: string; items: NavItem[] }

export const NAV: NavCategory[] = [  
  {
    label: 'Leetcode',
    items: [
      { title: '3027', href: '/leetcode/3027' }, 
      { title: '2749', href: '/leetcode/2749' }, 
    ],
  },
]
