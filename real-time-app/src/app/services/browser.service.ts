import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class BrowserService {

    /*
        BrowserId (browserId) represents the playerId but saved in localStorage/browser.
            ( playerId + localStorage/browser = browserId )
    */

    // OBSERVABLE:
    private loggedIn$ = new BehaviorSubject<boolean>(this.hasPlayer());
    public isLoggedInObservable$ = this.loggedIn$.asObservable();

    private hasPlayer(): boolean {
        
        const playerId = localStorage.getItem('playerId');

        if(playerId != null)
            return true;

        return false;
    }

    public getBrowserId(): string {
        
        return localStorage.getItem('playerId')!;
    }

    public setBrowserId(playerId: number) {

        this.loggedIn$.next(true);
        localStorage.setItem('playerId', playerId.toString());
    }

    public deleteBrowserId() {

        this.loggedIn$.next(false);
        localStorage.removeItem('playerId');
    }

}