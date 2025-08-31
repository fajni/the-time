import { Component, DestroyRef, ElementRef, EventEmitter, inject, OnInit, Output, ViewChild } from '@angular/core';
import { IPlayer } from '../models/IPlayer';
import { PlayerService } from '../services/player.service';
import { BrowserService } from '../services/browser.service';
import { RouterLink } from '@angular/router';
import { NumberService } from '../services/numbers.service';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-players',
  imports: [RouterLink],
  templateUrl: './players.html',
  styleUrl: './players.css'
})
export class Players implements OnInit {

  private playerService = inject(PlayerService);
  private browserService = inject(BrowserService);
  private numberService = inject(NumberService);
  private gameService = inject(GameService);
  private destroyRef = inject(DestroyRef);

  public players: IPlayer[] = [];


  public async ngOnInit() {

    // loggedIn status is always checked in navbar.ts

    /////

    await this.gameService.setLoser('');
    await this.numberService.clearDeletedNumbers();

    const sub = this.playerService.listenPlayers().subscribe((response) => {

      this.players = response;

    });

    this.destroyRef.onDestroy(() => sub.unsubscribe());

  }

  public async logIn(id: number) {

    const player = await this.playerService.getPlayerById(id);

    if(player != null) {
      player!.loggedIn = true;

      this.browserService.setBrowserId(player.id);

      this.playerService.setLoginForPlayer(player!.id, true);

      const numbers = this.numberService.getRandomInts(0, 10, 3);
      this.playerService.setNumbersForPlayer(player.id, numbers);
    }

  }

}