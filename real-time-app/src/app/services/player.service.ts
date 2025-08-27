import { inject, Injectable } from "@angular/core";
import { child, Database, get, onValue, ref, update } from "@angular/fire/database";
import { Observable } from "rxjs";
import { IPlayer } from "../models/IPlayer";
import { loggedIn } from "@angular/fire/auth-guard";

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


    public async getPlayers2(): Promise<IPlayer[]> {

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

    public isPlayerLoggedIn(id: number) {
        throw new Error("NOT IMPLEMENTED isPlayerLoggedIn! - player.service.ts");
    }

    public async setLoginForPlayer(id: number, value: boolean) {
        
        const player = ref(this.db, `players/player${id}`);

        if(player != null) {
            await update(player, { loggedIn: value });
        }

    }

}