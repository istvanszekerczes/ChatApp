import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatTypePicker } from './chat-type-picker';

describe('ChatTypePicker', () => {
  let component: ChatTypePicker;
  let fixture: ComponentFixture<ChatTypePicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatTypePicker],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatTypePicker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
