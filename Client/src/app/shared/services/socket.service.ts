import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

import * as io from 'socket.io-client';
import * as ss from 'socket.io-stream';

@Injectable()
export class SocketService {
    public socket;

    constructor() {
        this.socket = io(environment.api, {
            'reconnection': true,
            'reconnectionDelay': 500,
            'reconnectionAttempts': 5
        });

        var self = this;
        this.socket.on('connect', function() {
            self.socket.emit('auto-connect', {token: localStorage.getItem('token')});
        });
    }

    sendMessage(method, data: any = {}) {
        this.socket.emit(method, data);
    }

    sendMessageWithToken(method, data: any = {}) {
        data.token = localStorage.getItem('token');
        this.socket.emit(method, data);
    }

    sendStream(method, file, metadata: any = {}, onProgress: any = null) {
        metadata.size = file.size;
        metadata.filename = file.name;

        const stream = ss.createStream();
        ss(this.socket).emit(method, stream, metadata);
        const blobStream = ss.createBlobReadStream(file, { highWaterMark: 102400 * 5 });
        blobStream.pipe(stream);

        let sent = 0;
        blobStream.on('data', function (chunk) {
            sent += chunk.length;
            const percent = Math.ceil((sent / file.size) * 80);
            if (onProgress) {
                onProgress.emit({ guid: metadata.guid, percent: percent });
            }
        });
    }

    bind(method, callback) {
        this.socket.on(method, callback);
    }
}
