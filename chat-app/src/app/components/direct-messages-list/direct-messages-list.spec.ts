import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectMessagesList } from './direct-messages-list';

describe('DirectMessagesList', () => {
  let component: DirectMessagesList;
  let fixture: ComponentFixture<DirectMessagesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectMessagesList],
    }).compileComponents();

    fixture = TestBed.createComponent(DirectMessagesList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
