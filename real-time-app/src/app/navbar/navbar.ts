import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BrowserService } from '../services/browser.service';
import { PlayerService } from '../services/player.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {

  private browserService = inject(BrowserService);
  private playerService = inject(PlayerService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  public playerLoggedIn: boolean = false;

  public ngOnInit(): void {

    const sub = this.browserService.isLoggedInObservable$.subscribe(isLogged => {

      this.playerLoggedIn = isLogged;

      if (isLogged) {

        this.router.navigate(['/game']);

      } 
      else {

        this.router.navigate(['/players']);
      }
    });

    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  logout() {
    
    this.playerService.setLoginForPlayer(Number(this.browserService.getBrowserId()), false);

    this.browserService.deleteBrowserId();
    
    this.router.navigate(['/']);
  }
}