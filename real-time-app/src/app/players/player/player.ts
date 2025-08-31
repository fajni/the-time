import { Component, inject, OnInit } from '@angular/core';
import { IPlayer } from '../../models/IPlayer';
import { PlayerService } from '../../services/player.service';
import { BrowserService } from '../../services/browser.service';

@Component({
  selector: 'app-player',
  imports: [],
  templateUrl: './player.html',
  styleUrl: './player.css'
})
export class Player implements OnInit{

  private playerService = inject(PlayerService);
  private browserService = inject(BrowserService);

  public player!: IPlayer | null;

  public async ngOnInit() {

    const playerId = this.browserService.getBrowserId();

    this.player = await this.playerService.getPlayerById(Number(playerId));
    this.player!.image = 'assets/img/player' + this.player?.id + '.png';
    
  }

}
