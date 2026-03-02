import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getId() {
    return [{ id: 1 }];
  }
}
