import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { BrowserService } from '../services/browser.service';
import { Router } from '@angular/router';
import { IPlayer } from '../models/IPlayer';
import { PlayerService } from '../services/player.service';
import { StartGame } from "./start-game/start-game";
import { GameService } from '../services/game.service';
import { NumberService } from '../services/numbers.service';

@Component({
  selector: 'app-game',
  imports: [StartGame],
  templateUrl: './game.html',
  styleUrl: './game.css'
})
export class Game implements OnInit {

  private browserService = inject(BrowserService);
  private playerService = inject(PlayerService);
  private gameService = inject(GameService);
  private numberService = inject(NumberService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  public notLoggedInPlayers: IPlayer[] = [];
  public loggedInPlayers: IPlayer[] = [];
  public startGame: boolean = false;
  public countdown: number = 5;
  public currentPlayer!: IPlayer;


  public isPlayerLoggedIn(): boolean {

    var value: boolean = false;

    const isLoggedInSubscription = this.browserService.isLoggedInObservable$.subscribe(loggedIn => {

      if(loggedIn != null) {
        value = true;
      }
      
      else{
        this.router.navigate(['/']);
      }

    });

    this.destroyRef.onDestroy(() => {
      isLoggedInSubscription.unsubscribe();
    });

    return value;
  }
 
  public ngOnInit() {
    
    // this.isPlayerLoggedIn();

    const notAllLoggedInSubscription = this.playerService.listenPlayers().subscribe(async (response) => {

      this.notLoggedInPlayers = [];
      this.loggedInPlayers = [];
      this.countdown = 5;

      // SET CURRENT PLAYER (to read his numbers)
      for(let i = 0; i < response.length; i++) {
        if(response[i].id.toString() == this.browserService.getBrowserId()) {
          this.currentPlayer = response[i];
        }
      }

      // IF PLAYER CHANGES PAGE DON'T START COUNTDOWN AGAIN
      if(await this.gameService.getGameStatus()) {
        this.countdown = 0;
        this.startGame = true;
        return;
      }

      // SEPERATE THE LOGGED IN PLAYERS FROM NOT LOGGED IN PLAYERS
      for(let i = 0; i < response.length; i++) {
        
        if(response[i].loggedIn == false) {
          
          this.notLoggedInPlayers.push(response[i]);
          this.startGame = false;
          this.gameService.setGameStatus(false);

        }

        if(response[i].loggedIn == true) {

          this.loggedInPlayers.push(response[i]);

          if(response.length == this.loggedInPlayers.length) {;
            this.gameService.setGameStatus(true);
            this.startGame = true;
          }

        }

      }

      /*  IF PLAYER LOG OUT SAME NUMBERS STAYS THE SAME (PLAYER CAN START THE GAME WITH 1 NUMBER!) 
          REINITIALIZE NUMBERS! */

      // SET LENGTH OR CHANGE NUMBER OF USERS IN DATABASE !!!
      // this.loggedInPlayers.length == response.length
      if(this.loggedInPlayers.length == response.length) {
        
        this.startGame = true;
        
        for(let i = this.countdown; i >= 0; i--) {

          setTimeout(async () => {

            this.countdown = i;
            
            if(i == 0) {
              await this.gameService.setGameStatus(true);
            }
              
          }, (this.countdown - i) * 1000);

        }

      }

    });

    this.destroyRef.onDestroy(() => {
      notAllLoggedInSubscription.unsubscribe();
    });

  }

}
