import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { BrowserService } from '../services/browser.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.html',
  styleUrl: './game.css'
})
export class Game implements OnInit {

  private browserService = inject(BrowserService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  public playerLoggedIn: boolean = false;

  ngOnInit(): void {
    
    const sub = this.browserService.isLoggedInObservable$.subscribe(loggedIn => {

      if(loggedIn != null)
        this.playerLoggedIn = true;
      
      else
        this.router.navigate(['/']);

    });

    /*
    const browserId = this.browserService.getBrowserId();

    if(browserId != null){
      this.playerLoggedIn = true;
    }
    else {
      this.router.navigate(['/']);
    }
    */

    this.destroyRef.onDestroy(() => sub.unsubscribe());

  }

}
