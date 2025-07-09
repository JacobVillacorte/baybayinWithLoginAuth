import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { LoadingController, RefresherEventDetail } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-leaderboard',
  templateUrl: 'leaderboard.page.html',
  styleUrls: ['leaderboard.page.scss'],
  standalone: false,
})
export class LeaderboardPage implements OnInit, OnDestroy {
  leaderboard: any[] = [];
  currentUser: any = null;
  isLoading = false;
  hasPermissionError = false;
  isOffline = false;
  private authSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private loadingController: LoadingController
  ) {}

  async ngOnInit() {
    // Check initial online status
    this.isOffline = !navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOffline = false;
      if (this.currentUser) {
        this.loadLeaderboard();
      }
    });
    
    window.addEventListener('offline', () => {
      this.isOffline = true;
    });

    // Subscribe to authentication state changes
    this.authSubscription = this.authService.currentUser$.subscribe(async (user) => {
      this.currentUser = user;
      await this.loadLeaderboard();
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  ionViewWillEnter() {
    // Refresh leaderboard every time user enters this page
    this.loadLeaderboard();
  }

  async loadLeaderboard() {
    // Only load leaderboard if user is authenticated
    if (!this.currentUser) {
      this.leaderboard = [];
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.hasPermissionError = false;

    // Check if online before attempting to load
    if (!navigator.onLine) {
      console.log('Offline - skipping leaderboard load');
      this.isLoading = false;
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Loading leaderboard...',
    });
    await loading.present();

    try {
      // Set a timeout for the request
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const leaderboardPromise = this.authService.getLeaderboard();
      
      this.leaderboard = await Promise.race([leaderboardPromise, timeoutPromise]) as any[];
      this.hasPermissionError = false; // Reset permission error flag on successful load
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      this.leaderboard = [];
      this.hasPermissionError = true; // Set permission error flag on error
      
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('Permission denied')) {
          console.warn('Firebase Database rules need to be configured. Check FIREBASE_SETUP.md for instructions.');
        } else if (error.message.includes('timeout') || !navigator.onLine) {
          console.warn('Network timeout or offline - leaderboard unavailable');
        }
      }
    } finally {
      this.isLoading = false;
      await loading.dismiss().catch(() => {}); // Ignore dismiss errors
    }
  }

  async refreshLeaderboard(event: any) {
    try {
      // Only refresh if user is authenticated
      if (this.currentUser) {
        this.leaderboard = await this.authService.getLeaderboard();
      }
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
    } finally {
      event.target.complete();
    }
  }

  getRankIcon(index: number): string {
    switch (index) {
      case 0: return 'trophy';
      case 1: return 'medal';
      case 2: return 'ribbon';
      default: return 'star-outline';
    }
  }

  getRankColor(index: number): string {
    switch (index) {
      case 0: return 'warning'; // Gold
      case 1: return 'medium'; // Silver
      case 2: return 'tertiary'; // Bronze
      default: return 'primary';
    }
  }

  isCurrentUser(uid: string): boolean {
    return this.currentUser && this.currentUser.uid === uid;
  }
}
