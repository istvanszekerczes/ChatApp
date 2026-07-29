import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserItem } from './user-item';

describe('UserItem', () => {
  let component: UserItem;
  let fixture: ComponentFixture<UserItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserItem],
    }).compileComponents();

    fixture = TestBed.createComponent(UserItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
