import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  menus = [
    {
      title: '首頁圖片管理',
      active: false,
      icon: 'fa-home',
      subMenus: [
        {
          title: '圖片管理',
          path: 'home/manage',
        },
        {
          title: '新增圖片',
          path: 'home/add',
        },
      ],
    },
    {
      title: '最新消息管理',
      active: false,
      icon: ' fa-newspaper',
      subMenus: [
        {
          title: '消息管理',
          path: 'news/manage',
        },
        {
          title: '新增消息',
          path: 'news/add',
        },
      ],
    },
    {
      title: '產品目錄管理',
      active: false,
      icon: 'fa-box',
      subMenus: [
        {
          title: '產品管理',
          path: 'product/manage',
        },
        {
          title: '新增產品',
          path: 'product/add',
        },
      ],
    },
    {
      title: '問題與答案',
      active: false,
      icon: 'fa-question-circle',
      subMenus: [
        {
          title: '問題管理',
          path: 'faq/manage',
        },
        {
          title: '新增問題',
          path: 'faq/add',
        },
      ],
    },
  ];

  toggleMenu(menu: any) {
    this.menus.filter((x) => x != menu).map((x) => (x.active = false));
    menu.active = !menu.active;
    // const submenu = document.getElementById(menuId + '-submenu');
    // const icon = document.getElementById(menuId + '-icon');

    // // 先收折其他所有選單
    // const allSubmenus = document.querySelectorAll('.sub-menu');
    // const allIcons = document.querySelectorAll('.expand-icon');

    // allSubmenus.forEach((menu) => {
    //   if (menu.id !== menuId + '-submenu') {
    //     menu.classList.remove('show');
    //   }
    // });

    // allIcons.forEach((iconEl) => {
    //   if (iconEl.id !== menuId + '-icon') {
    //     iconEl.classList.remove('rotated');
    //   }
    // });

    // // 切換當前選單
    // submenu.classList.toggle('show');
    // icon.classList.toggle('rotated');
  }
}
