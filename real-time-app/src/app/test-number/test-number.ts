import { Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { TestService } from './test.service';

@Component({
  selector: 'app-test-number',
  imports: [],
  templateUrl: './test-number.html',
  styleUrl: './test-number.css'
})
export class TestNumber implements OnInit, OnDestroy{

  private testService = inject(TestService);
  private destroyRef = inject(DestroyRef);

  public myNumber: number = 0;

  public addNumber() {

    this.testService.addNumber(1);
  }

  public resetNumber() {

    this.testService.setNumber(0);
  }

  public ngOnInit() {
    
    const subscription = this.testService.listenNumber().subscribe(value => {
      this.myNumber = value;
    });

    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe(); 
    });
  }

  public ngOnDestroy() {
  }

}
