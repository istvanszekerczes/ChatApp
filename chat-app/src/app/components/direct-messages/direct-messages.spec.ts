import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectMessages } from './direct-messages';

describe('DirectMessages', () => {
  let component: DirectMessages;
  let fixture: ComponentFixture<DirectMessages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectMessages],
    }).compileComponents();

    fixture = TestBed.createComponent(DirectMessages);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
