import { Routes } from '@angular/router';
import { App } from './app';
import { About } from './about/about';
import { Players } from './players/players';
import { Game } from './game/game';

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
