import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { BrowserService } from '../services/browser.service';
import { PlayerService } from '../services/player.service';
import { IPlayer } from '../models/IPlayer';
import { GameService } from '../services/game.service';
import { NumberService } from '../services/numbers.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {

  private browserService = inject(BrowserService);
  private playerService = inject(PlayerService);
  private gameService = inject(GameService);
  private numberService = inject(NumberService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  public playerLoggedIn: boolean = false;
  public currentPlayer!: IPlayer | null;

  public ngOnInit() {

    const sub = this.browserService.isLoggedInObservable$.subscribe(async isLogged => {

      this.playerLoggedIn = isLogged;

      if (isLogged) {

        const playerId = this.browserService.getBrowserId();

        this.currentPlayer = await this.playerService.getPlayerById(Number(playerId));
        
        this.router.navigate(['/game']);

      } 
      else {

        this.router.navigate(['/players']);
      }
    });

    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  public async setOtherNumbersToLoggedInPlayers() {

    // you can't set numbers in listenPlayers(), can't do it in game.ts

    const allPlayers: IPlayer[] = await this.playerService.getPlayers();

    for(let i = 0; i < allPlayers.length; i++) {
      if(allPlayers[i].loggedIn == true) {

        const numbers = this.numberService.getRandomInts(0, 10, 3);
        this.playerService.setNumbersForPlayer(allPlayers[i].id, numbers);
        
      }
    }

  }

  public async logout() {
    
    await this.playerService.setLoginForPlayer(Number(this.browserService.getBrowserId()), false);
    await this.gameService.setGameStatus(false); // not nedded, you set game status in game component

    this.browserService.deleteBrowserId();
    
    this.router.navigate(['/']);

    // when 1 user logs out, all other players should get new numbers
    // reason: If a player leaves the game, new players will still have same numbers even if they
    //      played some numbers, so the player can start with only 1 number!
    await this.setOtherNumbersToLoggedInPlayers();
  }
}