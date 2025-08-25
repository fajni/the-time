import { inject, Injectable } from "@angular/core";
import { child, Database, get, onValue, ref, set } from "@angular/fire/database";
import { Observable } from "rxjs";

@Injectable({providedIn: 'root'})
export class TestService {

    private realTimeDb = inject(Database);


    // 🔥 realtime listener
    public listenNumber(): Observable<number> {
        
        return new Observable<number>((subscriber) => {

            const dbRef = ref(this.realTimeDb, 'number');

            const unsubscribe = onValue(dbRef, (snapshot) => {
                subscriber.next(snapshot.val() ?? 0);
            });

            // cleanup when unsubscribe
            return () => unsubscribe();
        });
    }

    public async getNumber(): Promise<number> {
        
        try {

            const dbRef = ref(this.realTimeDb);

            const snapshot = await get(child(dbRef, 'number'));

            if (snapshot.exists()) {
                return snapshot.val();
            } 
            else {
                console.log("No data!");
                return -1;
            }

        } catch (error) {
            
            console.error(error);
            return -1;
        }

    }

    public async addNumber(n: number) {

        try {

            const dbRef = ref(this.realTimeDb, 'number');

            const currentValue: number = await this.getNumber();

            await set(dbRef, currentValue + n);

        } catch (error) {
            console.error(error);
        }

    }

    public async setNumber(n: number) {

        try {

            const dbRef = ref(this.realTimeDb, 'number');

            await set(dbRef, n);

        } catch (error) {
            console.error(error);
        }

    }

}