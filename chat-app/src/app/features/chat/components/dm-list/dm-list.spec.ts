import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DmList } from './dm-list';

describe('DmList', () => {
  let component: DmList;
  let fixture: ComponentFixture<DmList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DmList],
    }).compileComponents();

    fixture = TestBed.createComponent(DmList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
