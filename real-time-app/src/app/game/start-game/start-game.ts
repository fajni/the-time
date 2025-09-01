import { Component, inject, Input, OnInit } from '@angular/core';
import { IPlayer } from '../../models/IPlayer';
import { PlayerService } from '../../services/player.service';
import { NumberService } from '../../services/numbers.service';
import { GameService } from '../../services/game.service';
import { Database, onValue, ref } from '@angular/fire/database';
import { Router } from '@angular/router';

@Component({
  selector: 'app-start-game',
  imports: [],
  templateUrl: './start-game.html',
  styleUrl: './start-game.css'
})
export class StartGame implements OnInit {

  private playerService = inject(PlayerService);
  private numberService = inject(NumberService);
  private gameService = inject(GameService);
  private router = inject(Router);

  private db = inject(Database);

  @Input({required: true})
  public player!: IPlayer

  public message: string = "";

  public async ngOnInit() {

    const gameRef = ref(this.db, `game`);

    onValue(gameRef, async (snapshot) => {

      if(snapshot.exists()) {

        if(await this.gameService.getGameStatus() == false) {
          this.message = `Game Over! ${ await this.gameService.getLoser() } was late!`;
        } 
      }

    });

  }

  public async deleteNumber(n: number) {

    const response: boolean = await this.numberService.deleteNumberForPlayerWithChecks(this.player.id, n);

    if(response == false) {
      this.gameService.setLoser(this.player.title);
      this.gameService.setGameStatus(false);
      this.numberService.clearDeletedNumbers();
      return;
    }
    else {
      this.playerService.deleteNumberForPlayer(this.player.id, n);
    }

    if(this.player.numbers == null) {
      this.message = "VICTORY!";
    }

  }

  public startAgain() {
    
    this.router.navigate(['/players']);
    location.reload();
  }

}
