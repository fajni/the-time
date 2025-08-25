import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TestNumber } from "./test-number/test-number";
import { Navbar } from "./navbar/navbar";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TestNumber, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

}
