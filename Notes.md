# My Notes

Some of my notes during the development. Problems, solutions, hosting, deploying, etc.

- [Development](#development)
    - [root (_app_)](#root-app)
    - [Components](#components)
    - [environments.ts](#how-to-create-the-environmentsts)
- [Problems and solutions](#problems-and-solutions)
    - [Player closes browser or web app](#player-closes-browser-or-web-app)
    - [Navbar won't refresh when the player is logged in/out](#navbar-doesnt-refresh-when-logged-inout)
    - [Other clients can see occupied player](#other-clients-can-see-occupied-player)
    - [Can't send/change data while listening to the same node in realtime](#cant-sendchange-data-while-listening-to-the-same-node-in-realtime)
- [Hosting](#hosting)


## Development

Installing the firebase: `npm install @angular/fire`

Start the app: `ng serve`

### How to create the __environments.ts__

Environment structure:

```ts
export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "---",
    authDomain: "your-project-name.firebaseapp.com",
    databaseURL: "---.europe-west1.firebasedatabase.app/",
    projectId: "---",
    storageBucket: "your-project-name.appspot.com",
    messagingSenderId: "---",
    appId: "---"
  }
};
```

<details>
<summary>Where to find needed values for environment</summary>

Go to console

- apiKey: In order to create apiKey, first you need to open 'Authentication' for you project which automatically create you apiKey. apiKey is stored: `Project Overview -> Project settings -> General -> Web API Key`,
- authDomain: Go to 'Authentication' `Settings -> Authorized domains -> your-project-name.firebaseapp.com`,
- databaseURL: `Realtime Database -> Data -> link.europe-west1.firebasedatabase.app`,
- projectId: `Project Overview -> Project settings -> Project ID`,
- storageBucket: `Cloud Firestore` idk, just type you project name and add _.appspot.com_,
- messagingSenderId: `Project settings -> Cloud Messaging -> Sender ID`,
- appId: Before you can access app id, you need to add app on your project, `Project settings -> General -> Add app`, on added app you can find App ID (example: `9:123456789000:web:13sr9a03d084e7850e7a80`).

</details>

__Add environments to app:__

- app.config.ts:

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    
    // connection with firebase
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideDatabase(() => getDatabase())
  ]
};
```

<details>
<summary>Models & Database structure</summary>

- Model: 

```ts
export interface IPlayer {
    
    id: number;
    loggedIn: boolean;
    title: string;

    image?: string;
}
```

- Firebase Realtime Database:

```
https://fajni-real-time-app-default-rtdb.europe-west1.firebasedatabase.app/
│
└── players
    │
    ├── player1
    │   │
    │   ├── id: number
    │   ├── loggedIn: boolean
    │   └── title: string
    │
    ├── player2
    │   │
    │   ├── id: number
    │   ├── loggedIn: boolean
    │   └── title: string
    │
    ├── player3
    │   │
    │   ├── id: number
    │   ├── loggedIn: boolean
    │   └── title: string
    │
    └── player4
        │
        ├── id: number
        ├── loggedIn: boolean
        └── title: string
```

</details>

### root (_app_)

- app.ts:

```ts
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
```

- app.html:

```html
<app-navbar />

<router-outlet />

<app-footer />
```

`<router-outlet />` - represents the content that will change (game, login, etc.)

- app.routes.ts:

```ts
export const routes: Routes = [
    {
        path: 'players',
        component: Players
    },
    {
        path: '',
        redirectTo: 'players',
        pathMatch: 'full'
    },
    {
        path: 'game',
        component: Game
    },
    {
        path: 'about',
        component: About
    }
];
```

### Components

#### Services

- player.service.ts (_communication with firebase realtime database_):

```ts
@Injectable({ providedIn: 'root' })
export class PlayerService {

    private db = inject(Database);


    // 🔥 realtime listener
    public listenPlayers(): Observable<IPlayer[]> {

        return new Observable<IPlayer[]>((subscriber) => {

            const dbRef = ref(this.db, 'players');

            const unsubscribe = onValue(dbRef, (snapshot) => {

                if(snapshot.exists()) {
                    const data = snapshot.val();

                    const players = Object.values(data) as IPlayer[];
                    subscriber.next(players);
                }
                else {
                    subscriber.next([]);
                }

            });

            // cleanup when unsubscribe
            return () => unsubscribe();
        });
    }


    public async getPlayers(): Promise<IPlayer[]> {

        try {

            const dbRef = ref(this.db);

            const snapshot = await get(child(dbRef, 'players'));

            if (snapshot.exists()) {

                const data = snapshot.val();
                
                // set data as the right type
                const players: IPlayer[] = Object.values(data) as IPlayer[];

                for(let i = 0; i < players.length; i++) {
                    players[i].image = `assets/img/player${i+1}.png`;
                }
                
                return players;
            }
            else {
                console.log("No players found!");
                return [];
            }

        } catch (error) {

            console.error(error);
            return [];
        }
    }

    // not currently used
    public async getPlayerById(id: number): Promise<IPlayer | null> {

        try {

            const dbRef = ref(this.db);

            const snapshot = await get(child(dbRef, `players/player${id}`));

            if (snapshot.exists()) {
                
                return snapshot.val() as IPlayer;
            }
            else {
                console.log(`No player with ${id} id found!`);
                return null;
            }

        } catch (error) {

            console.error(error);
            return null;
        }

    }

    public async setLoginForPlayer(id: number, value: boolean) {
        
        const player = ref(this.db, `players/player${id}`);

        if(player != null) {
            await update(player, { loggedIn: value });
        }

    }

}
```

- browser.service.ts:

```ts
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

    // METHODS:

    public getBrowserId(): string {
        
        return localStorage.getItem('playerId')!;
    }

    public setBrowserId(playerId: number) {

        localStorage.setItem('playerId', playerId.toString());
        this.loggedIn$.next(true);
    }

    public deleteBrowserId() {

        localStorage.removeItem('playerId');
        this.loggedIn$.next(false);
    }

}
```

#### NAVBAR

All the login check does the navbar component, and based on that the navbar updates. (Show Game and Logout only if the player is logged in, show home page if the player is not logged in, etc. )

- navbar.ts:

```ts
export class Navbar implements OnInit {

  private browserService = inject(BrowserService);
  private playerService = inject(PlayerService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  public playerLoggedIn: boolean = false;

  public ngOnInit(): void {

    // Instead of using the getBrowserId() method to check if the user is logged in,
    // we're using the Observable to update in real time.
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
```

- navbar.html:

```html
<nav>

    <input type="checkbox" id="check">
    <label for="check" class="checkbtn">
        <i class="fas fa-bars"></i>
    </label>

    <label class="logo rotate">THE MIND</label>
    <ul>

        @if(!playerLoggedIn) {
            <li><a routerLink="/">Home/Players</a></li>
        }
        
        <li><a routerLink="/about">About</a></li>

        @if(playerLoggedIn) {
            <li><a routerLink="/game">Game</a></li>
            <li><a>Player</a></li>
            <li><a (click)="logout()">Logout</a></li>
        }
        
    </ul>

</nav>
```

#### PLAYERS

When you click on player, do the login!

## Problems and solutions

### Player closes browser or web app

- Problem (delete localStorage and set loggedIn to false when the player closes the browser or the web app):

- Solution:

```ts
export class App {

  /*
    THIS DECORATOR (@HostListener) IS CALLED EVERY TIME WHEN THE CLIENT CLOSES THE BROWSER OR THE WEB APP !

    This decorator solves the problem if the client doesn't log out properly. When the client
      just close the browser or the web app local storage is deleted.
  */

  private browserService = inject(BrowserService);
  private playerService = inject(PlayerService);

  @HostListener('window:beforeunload', ['$event'])
  public unloadHandler(event: Event) {

    const playerId = this.browserService.getBrowserId();

    if(playerId) {
        this.playerService.setLoginForPlayer(Number(playerId), false);
        this.browserService.deleteBrowserId();
    }

  }

}
```

<hr/>

### NavBar doesn't refresh when logged in/out

- Problem (navbar doesn't refresh after the player is logged in):

> [!NOTE]  
> Navbar will refresh only if the user refresh the web app or if we call _location.reload()_

```ts
@Injectable({ providedIn: 'root' })
export class BrowserService {

    /*
        BrowserId (browserId) represents the playerId but saved in localStorage/browser.
            ( playerId + localStorage/browser = browserId )
    */

    public getBrowserId(): string {
        
        return localStorage.getItem('playerId')!;
    }

    public setBrowserId(playerId: number) {

        localStorage.setItem('playerId', playerId.toString());
    }

    public deleteBrowserId() {
        
        localStorage.removeItem('playerId');
    }

}
```

```ts
export class Navbar implements OnInit {

  private browserService = inject(BrowserService);
  private playerService = inject(PlayerService);
  private router = inject(Router);

  public playerLoggedIn: boolean = false;

  public ngOnInit(): void {

    const browserId = this.browserService.getBrowserId();

    if(browserId != null) {
        this.router.navigate(['/game']);
    }
    else {
        this.router.navigate(['/']);
    }

    
  }

  logout() {
    
    this.playerService.setLoginForPlayer(Number(this.browserService.getBrowserId()), false);

    this.browserService.deleteBrowserId();
    
    this.router.navigate(['/']);
  }
}
```

- Solution (refresh content/data in real time; _Observable_):

```ts
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

        localStorage.setItem('playerId', playerId.toString());
        this.loggedIn$.next(true);
    }

    public deleteBrowserId() {

        localStorage.removeItem('playerId');
        this.loggedIn$.next(false);
    }

}
```

```ts
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
```

```html
<nav>

    <input type="checkbox" id="check">
    <label for="check" class="checkbtn">
        <i class="fas fa-bars"></i>
    </label>

    <label class="logo rotate">THE MIND</label>
    <ul>

        @if(!playerLoggedIn) {
            <li><a routerLink="/">Home/Players</a></li>
        }
        
        <li><a routerLink="/about">About</a></li>

        @if(playerLoggedIn) {
            <li><a routerLink="/game">Game</a></li>
            <li><a>Player</a></li>
            <li><a (click)="logout()">Logout</a></li>
        }
        
    </ul>

</nav>
```

<hr/>

### Other clients can see occupied player

- Problem (After the player2 is logged in, others who watch won't see that the player2 is occupied):

> [!NOTE]  
> It will only remove occupied player once the web app is refreshed (_location.reload()_):

| METHOD          | RETURN TYPE           | DESCRIPTION |
|-----------------|-----------------------|-------------|
| getPlayers()    | Promise<IPlayer[]>    |             |
| listenPlayers() | Observable<IPlayer[]> |             |

> [!NOTE]  
> Difference between Promise vs Observable
> - Promise = once and it's done.
> - Observable = stream of values, with control and operators.

- PlayerService:

```ts
@Injectable({ providedIn: 'root' })
export class PlayerService {

    private db = inject(Database);


    public async getPlayers(): Promise<IPlayer[]> {

        try {

            const dbRef = ref(this.db);

            const snapshot = await get(child(dbRef, 'players'));

            if (snapshot.exists()) {

                const data = snapshot.val();
                
                // set data as the right type
                const players: IPlayer[] = Object.values(data) as IPlayer[];

                for(let i = 0; i < players.length; i++) {
                    players[i].image = `assets/img/player${i+1}.png`;
                }
                
                return players;
            }
            else {
                console.log("No players found!");
                return [];
            }

        } catch (error) {

            console.error(error);
            return [];
        }
    }

    public async getPlayerById(id: number): Promise<IPlayer | null> {

        try {

            const dbRef = ref(this.db);

            const snapshot = await get(child(dbRef, `players/player${id}`));

            if (snapshot.exists()) {
                
                return snapshot.val() as IPlayer;
            }
            else {
                console.log(`No player with ${id} id found!`);
                return null;
            }

        } catch (error) {

            console.error(error);
            return null;
        }

    }

    public async setLoginForPlayer(id: number, value: boolean) {
        
        const player = ref(this.db, `players/player${id}`);

        if(player != null) {
            await update(player, { loggedIn: value });
        }

    }

}
```

- BrowserService:

```ts
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

        localStorage.setItem('playerId', playerId.toString());
        this.loggedIn$.next(true);
    }

    public deleteBrowserId() {

        localStorage.removeItem('playerId');
        this.loggedIn$.next(false);
    }

}
```

- Players component:

```ts
export class Players implements OnInit {

  private playerService = inject(PlayerService);
  private browserService = inject(BrowserService);
  private route = inject(Router);

  public players: IPlayer[] = [];
  public message: string = "";


  public async ngOnInit() {

    // loggedIn status is always checked in navbar.ts

    /////

    this.players = await this.playerService.getPlayers();

    if(this.players.length < 1) {
        this.message = "Not enough players!";
        this.players = [];
    }

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
```

```html
@if (message != "") {
    <h1>{{message}}</h1>
}
@else {
    <h1 class="rotate">Choose you player: </h1>
    <main class="grid">

        @for (player of players; track $index) {
            
            @if(player.loggedIn == false){
                <article class="card zoom" (click)="logIn(player.id)">

                    <img [src]="player.image" [alt]="player.title" />
                    <div class="title">{{player.title.toUpperCase()}}</div>

                </article>
            }
        }

    </main>
}
```

- Solution (Realtime Database listener):

- PlayerService:

```ts
@Injectable({ providedIn: 'root' })
export class PlayerService {

    private db = inject(Database);


    // 🔥 realtime listener
    public listenPlayers(): Observable<IPlayer[]> {

        return new Observable<IPlayer[]>((subscriber) => {

            const dbRef = ref(this.db, 'players');

            const unsubscribe = onValue(dbRef, (snapshot) => {

                if(snapshot.exists()) {
                    const data = snapshot.val();

                    const players = Object.values(data) as IPlayer[];

                    for(let i = 0; i < players.length; i++) {
                        players[i].image = `assets/img/player${i + 1}.png`;
                    }

                    subscriber.next(players);
                }
                else {
                    subscriber.next([]);
                }

            });

            // cleanup when unsubscribe
            return () => unsubscribe();
        });
    }

    public async getPlayerById(id: number): Promise<IPlayer | null> {

        try {

            const dbRef = ref(this.db);

            const snapshot = await get(child(dbRef, `players/player${id}`));

            if (snapshot.exists()) {
                
                return snapshot.val() as IPlayer;
            }
            else {
                console.log(`No player with ${id} id found!`);
                return null;
            }

        } catch (error) {

            console.error(error);
            return null;
        }

    }

    public async setLoginForPlayer(id: number, value: boolean) {
        
        const player = ref(this.db, `players/player${id}`);

        if(player != null) {
            await update(player, { loggedIn: value });
        }

    }

}
```

- BrowserService (_stays the same_):

```ts
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

        localStorage.setItem('playerId', playerId.toString());
        this.loggedIn$.next(true);
    }

    public deleteBrowserId() {

        localStorage.removeItem('playerId');
        this.loggedIn$.next(false);
    }

}
```

- Players component:

```ts
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
```

### Can't send/change data while listening to the same node in realtime

- Problem (Can't send data _setNumbersForPlayer()_ inside _listenPlayers()_ subscription):

> [!NOTE]  
> _listenPlayers()_ emits snapshot every time when the database changes, 
> and if you do the _update()_ in the same node - triggers new snapshot. <br/>
> Problem: __INFINITE LOOP__ - Maximm call stack size exceeded.

```ts
@Injectable({ providedIn: 'root' })
export class PlayerService {

    private db = inject(Database);


    // 🔥 realtime listener
    public listenPlayers(): Observable<IPlayer[]> {

        return new Observable<IPlayer[]>((subscriber) => {

            const dbRef = ref(this.db, 'players');

            const unsubscribe = onValue(dbRef, (snapshot) => {

                if(snapshot.exists()) {
                    const data = snapshot.val();

                    const players = Object.values(data) as IPlayer[];

                    for(let i = 0; i < players.length; i++) {
                        players[i].image = `assets/img/player${i + 1}.png`;
                    }

                    subscriber.next(players);
                }
                else {
                    subscriber.next([]);
                }

            });

            // cleanup when unsubscribe
            return () => unsubscribe();
        });
    }

    public async setNumbersForPlayer(id: number, numbers: number[]) {

        const player = ref(this.db, `players/player${id}`);

        if(player != null) {
            await update(player, { numbers: numbers })
        }
    }

    public async setLoginForPlayer(id: number, value: boolean) {
        
        const player = ref(this.db, `players/player${id}`);

        if(player != null) {
            await update(player, { loggedIn: value });
        }

    }

}
```

```ts
@Component({
  selector: 'app-game',
  imports: [StartGame],
  templateUrl: './game.html',
  styleUrl: './game.css'
})
export class Game implements OnInit {

  private browserService = inject(BrowserService);
  private playerService = inject(PlayerService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  public notLoggedInPlayers: IPlayer[] = [];
  public loggedInPlayers: IPlayer[] = [];
  public startGame: boolean = false;
  public countdown: number = 5;

  public getRandomInts(min: number, max: number, length: number): number[] {
    return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min );
  }

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

    const notAllLoggedInSubscription = this.playerService.listenPlayers().subscribe((response) => {

      this.notLoggedInPlayers = [];
      this.loggedInPlayers = [];
      this.startGame = false;
      this.countdown = 5;
      
      for(let i = 0; i < response.length; i++) {
        
        if(response[i].loggedIn == false) {
          
          this.notLoggedInPlayers.push(response[i]);
        }

        if(response[i].loggedIn == true) {
          
          this.loggedInPlayers.push(response[i]);
          this.playerService.setNumbersForPlayer(response[i].id, randomNumbers); // PROBLEM!!!
        }
      }
      
      if(this.loggedInPlayers.length == response.length) {

        this.startGame = true;

        for(let i = this.countdown; i >= 0; i--) {
          setTimeout(() => {
            this.countdown = i;
          }, (this.countdown - i) * 1000);
        }

      }

    });

    this.destroyRef.onDestroy(() => {
      notAllLoggedInSubscription.unsubscribe();
    });

  }

}
```

- Solution (Maybe set the numbers when the player is logged in (call method when the player is logged in) ):

```ts

public getRandomInts(min: number, max: number, length: number): number[] {
    return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min );
}

public async logIn(id: number) {

    const player = await this.playerService.getPlayerById(id);

    if(player != null) {
      player!.loggedIn = true;

      this.browserService.setBrowserId(player.id);

      this.playerService.setLoginForPlayer(player!.id, true);

      const numbers = this.getRandomInts(0, 10, 3);
      this.playerService.setNumbersForPlayer(player.id, numbers);
    }

}
```

## Hosting

Firebase

- database: Realtime database
- web: Hosting