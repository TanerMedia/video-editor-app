import { SocketService } from './socket.service';
import { Injectable, EventEmitter } from '@angular/core';

import { environment } from '../../../environments/environment';

let $this: UserService;

@Injectable()
export class UserService {
  public onUpdateProject = new EventEmitter();
  public onUpdateUserProfile = new EventEmitter();

  constructor(private socket: SocketService) {
    $this = this;

    this.socket.bind('UPDATE_USER_RESPONSE', this._updateUserResponse);
    this.socket.bind('UPDATE_USER_PROFILE_RESPONSE', this._updateUserProfileResponse);
  }

  /**
   * 
   * @param isGetStarted 
   */
  _updateUser(data) {
    this.socket.sendMessageWithToken('UPDATE_USER', {data: data });
  }

  /**
     *
     * @param file     
     * @param metadata = {usr_email: x, guid: x}
     */
  _updateUserProfile(file, metadata) {
    this.socket.sendStream('UPDATE_USER_PROFILE', file, metadata, null);
  }

  _updateUserResponse(response) {
    $this.onUpdateProject.emit(response);
  }

  _updateUserProfileResponse(response) {
    $this.onUpdateUserProfile.emit(response);
  }
}
