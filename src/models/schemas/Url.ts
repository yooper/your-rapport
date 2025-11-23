import { INameOnly } from '../../types';

class Url implements INameOnly {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}
