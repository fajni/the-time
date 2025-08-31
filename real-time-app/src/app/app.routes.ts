import { Routes } from '@angular/router';
import { App } from './app';
import { About } from './about/about';
import { Players } from './players/players';
import { Game } from './game/game';
import { Player } from './players/player/player';

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
        path: 'player',
        component: Player
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
