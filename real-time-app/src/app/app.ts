import { Component, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "./navbar/navbar";
import { BrowserService } from './services/browser.service';
import { PlayerService } from './services/player.service';
import { GameService } from './services/game.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  /*
    THIS DECORATOR (@HostListener) IS CALLED EVERY TIME WHEN THE CLIENT CLOSES THE BROWSER OR THE WEB APP !

    This decorator solves the problem if the client doesn't log out properly. When the client
      just close the browser or the web app local storage is deleted.
  */

  private browserService = inject(BrowserService);
  private playerService = inject(PlayerService);
  private gameService = inject(GameService);

  @HostListener('window:beforeunload', ['$event'])
  public unloadHandler(event: Event) {

    const playerId = this.browserService.getBrowserId();

    if(playerId) {
      this.playerService.setLoginForPlayer(Number(playerId), false);
      this.browserService.deleteBrowserId();
      this.gameService.setGameStatus(false);        
    }

  }

}
