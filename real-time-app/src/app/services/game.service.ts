import { inject, Injectable } from "@angular/core";
import { child, Database, get, onValue, ref, set, update } from "@angular/fire/database";
import { Observable } from "rxjs";

@Injectable({providedIn: 'root'})
export class GameService {

    private db = inject(Database);

    // ✅ realtime listening
    public listenGameStatus(): Observable<boolean> {
        return new Observable<boolean>((subscriber) => {
            const statusRef = ref(this.db, 'game/status');

            const unsubscribe = onValue(statusRef, (snapshot) => {
                subscriber.next(snapshot.val() as boolean);
            });

            // cleanup
            return () => unsubscribe();

        });
    }

    public async setGameStatus(value: boolean) {

        const game = ref(this.db, `game`);

        await update(game, {status: value} );
    }

    public async getGameStatus(): Promise<boolean> {

        const gameStatusRef = ref(this.db, 'game/status');

        const snapshot = await get(gameStatusRef);

        return snapshot.val() as boolean;
    }

    public async setLoser(title: string) {

        const game = ref(this.db, `game`);

        await update(game, {loser: title} );
    }

    public async getLoser() {
        const gameLoserRef = ref(this.db, 'game/loser');

        const snapshot = await get(gameLoserRef);

        return snapshot.val() as string;
    }

}