import { INameOnly } from '../../types';

class Domain implements INameOnly{
  name: string;

  constructor(name: string) {
    this.name = name;
  }

}