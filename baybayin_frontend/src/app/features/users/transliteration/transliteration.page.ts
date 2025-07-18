import { Component, OnInit, OnDestroy } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

import { TransliterationService } from '../../../core/services/transliteration/transliteration.service';
import { ScoreService } from '../../../core/services/score.service';
import { AuthService } from '../../../core/services/auth.service';
import { QuestUpdateService } from '../../../core/services/quest-update.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-transliteration',
  templateUrl: 'transliteration.page.html',
  styleUrls: ['transliteration.page.scss'],
  standalone: false,
})
export class TransliterationPage implements OnInit, OnDestroy {
  transliterationDirection: 'latin-to-baybayin' | 'baybayin-to-latin' = 'latin-to-baybayin';
  isLatinToBaybayin: boolean = true;
  showTextInput = false;
  showUploadPreview = false;
  inputText = '';
  result: string | null = null;
  cameraImage: string | null = null;
  uploadedImageSrc: string | null = null;
  expectedText: string = ''; // For scoring purposes
  currentUser: any = null;
  private authSubscription?: Subscription;

  // Baybayin character arrays
  baybayinVowels = [
    { baybayin: 'ᜀ', latin: 'a' },
    { baybayin: 'ᜁ', latin: 'i/e' },
    { baybayin: 'ᜂ', latin: 'u/o' }
  ];

  baybayinConsonants = [
    { baybayin: 'ᜃ', latin: 'ka' },
    { baybayin: 'ᜄ', latin: 'ga' },
    { baybayin: 'ᜅ', latin: 'nga' },
    { baybayin: 'ᜆ', latin: 'ta' },
    { baybayin: 'ᜇ', latin: 'da' },
    { baybayin: 'ᜈ', latin: 'na' },
    { baybayin: 'ᜉ', latin: 'pa' },
    { baybayin: 'ᜊ', latin: 'ba' },
    { baybayin: 'ᜋ', latin: 'ma' },
    { baybayin: 'ᜌ', latin: 'ya' },
    { baybayin: 'ᜍ', latin: 'ra' },
    { baybayin: 'ᜎ', latin: 'la' },
    { baybayin: 'ᜏ', latin: 'wa' },
    { baybayin: 'ᜐ', latin: 'sa' },
    { baybayin: 'ᜑ', latin: 'ha' }
  ];

  baybayinSpecial = [
    { baybayin: 'ᜓ', latin: 'kudlit (u/o)' },
    { baybayin: 'ᜒ', latin: 'kudlit (i/e)' },
    { baybayin: '᜔', latin: 'virama' }
  ];

  constructor(
    private transliterateService: TransliterationService,
    private scoreService: ScoreService,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private questUpdateService: QuestUpdateService
  ) {}

  ngOnInit() {
    // Subscribe to authentication state changes
    this.authSubscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  async onCamera() {
    // Clear other inputs when using camera
    this.clearAllInputs();
    
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      this.cameraImage = image.dataUrl || null;
      this.result = 'ARA DAE.';
      
      // Remove automatic point awarding - link to quest instead
      if (this.result && this.result !== 'Camera cancelled or failed.') {
        // No automatic points - camera usage doesn't count for text quest
      }
    } catch (err) {
      this.result = 'Camera cancelled or failed.';
    }
  }

  handleCamera(event: any) {
    // (Not used with Capacitor Camera)
  }

  onUpload() {
    // Clear other inputs when using upload
    this.clearAllInputs();
    
    // Trigger upload input
    const uploadInput = document.querySelector<HTMLInputElement>('#uploadInput');
    uploadInput?.click();
  }

  async handleUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Create preview of uploaded image
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.uploadedImageSrc = e.target.result;
        this.showUploadPreview = true;
      };
      reader.readAsDataURL(file);
    }
    
    // Send uploaded image to backend for transliteration
    // Placeholder: show result
    this.result = 'Uploaded image sent to James and Jhed.';
    
    // Remove automatic points for upload - only text feature counts for quest
    // Upload usage doesn't count for text quest
  }

  onText() {
    // Clear other inputs when using text
    this.clearAllInputs();
    this.showTextInput = !this.showTextInput;
  }

  clearAllInputs() {
    // Clear all input states
    this.showTextInput = false;
    this.showUploadPreview = false;
    this.cameraImage = null;
    this.uploadedImageSrc = null;
    this.inputText = '';
    this.result = null;
  }

  addCharacter(character: string) {
    // Add the selected Baybayin character to the input text
    this.inputText += character;
  }

  clearText() {
    // Clear the input text
    this.inputText = '';
  }

  async submitText() {
    if (!this.inputText) {
      this.result = 'Please enter some text.';
      return;
    }
    
    if (this.transliterationDirection === 'latin-to-baybayin') {
      this.transliterateService.transliterateText(this.inputText).subscribe({
        next: async (response) => {
          console.log(response);
          this.result = response.transliterated_text || 'Transliteration completed';
          // Track transliteration usage for quests (only for authenticated users)
          if (response.transliterated_text && this.currentUser) {
            try {
              await this.authService.trackTransliterationUsage(this.currentUser.uid);
              // Notify quest page to update in real-time
              this.questUpdateService.notifyQuestUpdate('transliterate_3');
              this.showQuestProgressToast();
            } catch (error) {
              console.error('Error tracking transliteration:', error);
              // Still show success message even if tracking fails
              this.showSuccessToast();
            }
          } else if (response.transliterated_text) {
            // For guest users, just show success without quest tracking
            this.showSuccessToast();
          }
        },
        error: (err) => {
          console.log(err);
          this.result = 'Error processing text. Please try again.';
        }
      });
    } else {
      // Baybayin to Latin translation
      this.result = this.translateBaybayinToLatin(this.inputText);
      
      // Track transliteration usage for quests (only for authenticated users)
      if (this.result && this.currentUser) {
        try {
          await this.authService.trackTransliterationUsage(this.currentUser.uid);
          // Notify quest page to update in real-time
          this.questUpdateService.notifyQuestUpdate('transliterate_3');
          this.showQuestProgressToast();
        } catch (error) {
          console.error('Error tracking transliteration:', error);
          // Still show success message even if tracking fails
          this.showSuccessToast();
        }
      } else if (this.result) {
        // For guest users, just show success without quest tracking
        this.showSuccessToast();
      }
    }
  }

  private translateBaybayinToLatin(baybayinText: string): string {
    // Simple character-by-character translation
    let result = '';
    
    for (let char of baybayinText) {
      // Check vowels
      const vowel = this.baybayinVowels.find(v => v.baybayin === char);
      if (vowel) {
        result += vowel.latin;
        continue;
      }
      
      // Check consonants
      const consonant = this.baybayinConsonants.find(c => c.baybayin === char);
      if (consonant) {
        result += consonant.latin;
        continue;
      }
      
      // Check special characters
      const special = this.baybayinSpecial.find(s => s.baybayin === char);
      if (special) {
        result += `[${special.latin}]`;
        continue;
      }
      
      // If character not found, keep original
      result += char;
    }
    
    return result || 'Translation completed';
  }

  switchDirection() {
    // Deprecated: replaced by onToggleDirection
    this.transliterationDirection =
      this.transliterationDirection === 'latin-to-baybayin'
        ? 'baybayin-to-latin'
        : 'latin-to-baybayin';
    this.inputText = '';
    this.result = null;
  }

  onToggleDirection() {
    this.transliterationDirection = this.isLatinToBaybayin ? 'latin-to-baybayin' : 'baybayin-to-latin';
    this.inputText = '';
    this.result = null;
  }

  private async showQuestProgressToast() {
    const toast = await this.toastController.create({
      message: 'Text transliteration completed! Quest progress updated.',
      duration: 3000,
      color: 'success',
      position: 'bottom',
      buttons: [
        {
          text: 'View Quests',
          handler: () => {
            this.router.navigate(['/tabs/quests']);
          }
        }
      ]
    });
    toast.present();
  }

  private async showSuccessToast() {
    const toast = await this.toastController.create({
      message: 'Text transliteration completed successfully!',
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
    toast.present();
  }
}
