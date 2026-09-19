import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { HashingService } from './hashing.service';

@Injectable()
export class BcryptService extends HashingService {
  private readonly saltRounds = 10;

  hash(value: string) {
    return bcrypt.hash(value, this.saltRounds);
  }

  compare(value: string, hash: string) {
    return bcrypt.compare(value, hash);
  }
}
