import { Component, DestroyRef, ElementRef, EventEmitter, inject, OnInit, Output, ViewChild } from '@angular/core';
import { IPlayer } from '../models/IPlayer';
import { PlayerService } from '../services/player.service';
import { BrowserService } from '../services/browser.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-players',
  imports: [],
  templateUrl: './players.html',
  styleUrl: './players.css'
})
export class Players implements OnInit {

  private playerService = inject(PlayerService);
  private browserService = inject(BrowserService);
  private route = inject(Router);
  private destroyRef = inject(DestroyRef);

  public players: IPlayer[] = [];
  public message: string = "";


  public async ngOnInit() {

    // loggedIn status is always checked in navbar.ts

    /////

    const sub = this.playerService.listenPlayers().subscribe((response) => {

      this.players = response;

      if(this.players.length < 1) {
        this.message = "Not enough players!";
        this.players = [];
      }

    });

    this.destroyRef.onDestroy(() => sub.unsubscribe());

  }

  public async logIn(id: number) {

    const player = await this.playerService.getPlayerById(id);

    if(player != null) {
      player!.loggedIn = true;

      this.browserService.setBrowserId(player.id);

      this.playerService.setLoginForPlayer(player!.id, true);
    }

    console.log(player);

  }

}