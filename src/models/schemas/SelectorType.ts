import { INameOnly } from '../../types';

class SelectorType implements INameOnly {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}
