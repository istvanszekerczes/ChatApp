import { TestBed } from '@angular/core/testing';

import { Panel } from './panel';

describe('Panel', () => {
  let service: Panel;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Panel);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
