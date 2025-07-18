import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TabsPage } from './tabs.page';
import { UserGuard } from '../core/guards/user.guard';
import { AdminGuard } from '../core/guards/admin.guard';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      // Admin Routes
      {
        path: 'analytics',
        loadChildren: () => import('../features/admin/analytics/analytics.module').then(m => m.AnalyticsPageModule),
        canActivate: [AdminGuard]
      },
      {
        path: 'dashboard',
        loadChildren: () => import('../features/admin/dashboard/dashboard.module').then(m => m.DashboardPageModule),
        canActivate: [AdminGuard]
      },
      
      // User Routes
      {
        path: 'transliteration',
        loadChildren: () => import('../features/users/transliteration/transliteration.module').then(m => m.TransliterationPageModule),
        canActivate: [UserGuard]
      },
      {
        path: 'leaderboard',
        loadChildren: () => import('../features/users/leaderboard/leaderboard.module').then(m => m.LeaderboardPageModule),
        canActivate: [UserGuard]
      },
      {
        path: 'baybayin-info',
        loadChildren: () => import('../features/users/baybayin-info/baybayin-info.module').then(m => m.BaybayinInfoPageModule),
        canActivate: [UserGuard]
      },
      {
        path: 'quests',
        loadChildren: () => import('../features/users/quests/quests.module').then(m => m.QuestsPageModule),
        canActivate: [UserGuard]
      },
      {
        path: 'profile',
        loadChildren: () => import('../features/users/profile/profile.module').then(m => m.ProfilePageModule),
        canActivate: [UserGuard]
      },
      {
        path: '',
        redirectTo: '/tabs/transliteration',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule {}
