import { inject, Injectable } from "@angular/core";
import { Database, get, ref, set } from "@angular/fire/database";
import { numbers } from "../../assets/data/numbers";

@Injectable({ providedIn: 'root' })
export class NumberService {

    private db = inject(Database);


    public getRandomInts(min: number, max: number, length: number): number[] {

        var numbers: number[] = [];

        while (numbers.length < 3) {

            const number = Math.floor(Math.random() * (max - min + 1)) + min;

            if (!numbers.includes(number)) {
                numbers.push(number);
            }

        }

        //return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min );

        return numbers.sort((a, b) => a - b);
    }

    public async clearDeletedNumbers() {

        const deletedNumbersRef = ref(this.db, "deletedNumbers");

        await set(deletedNumbersRef, '');
    }

    public async isDeletedNumbersEmpty(): Promise<boolean> {

        const deletedNumbersRef = ref(this.db, 'deletedNumbers');
        const snapshot = await get(deletedNumbersRef);

        // node doesn't exist!
        if(!snapshot.exists()) {
            return false;
        }

        const data = snapshot.val();

        if(data.length === 0) {
            return true;
        }

        return false;
    }

    public async deleteNumberForPlayerWithChecks(id: number, number: number) {

        const playerNumbersRef = ref(this.db, `player/player${id}/numbers`);
        const deletedNumbersRef = ref(this.db, `deletedNumbers`);

        const playerNumbersSnapshow = await get(playerNumbersRef);
        const deletedNumbersSnapshot = await get(deletedNumbersRef);

        const playerNumbers: number[] = playerNumbersSnapshow.val();
        const deletedNumbers: number[] = deletedNumbersSnapshot.val();
        
        if (deletedNumbers.length > 0) {

            const lastDeleted = deletedNumbers[deletedNumbers.length - 1];

            if (number < lastDeleted) {
                console.log('Number is smaller than the last!');
                this.clearDeletedNumbers();
                return false;
            }
        }

        const updatedPlayerNumbers = numbers.filter(n => n !== number);

        const updatedDeletedNumbers = [...deletedNumbers, number];

        await set(playerNumbersRef, updatedPlayerNumbers);
        await set(deletedNumbersRef, updatedDeletedNumbers);

        return true;
    }



}