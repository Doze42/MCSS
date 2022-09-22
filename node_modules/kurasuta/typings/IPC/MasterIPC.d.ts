/// <reference types="node" />
import { EventEmitter } from 'events';
import { Server } from 'veza';
import { ShardingManager } from '..';
export declare class MasterIPC extends EventEmitter {
    manager: ShardingManager;
    [key: string]: any;
    server: Server;
    constructor(manager: ShardingManager);
    broadcast(code: string): Promise<unknown[]>;
    private _incommingMessage;
    private _message;
    private _broadcast;
    private _ready;
    private _shardready;
    private _shardreconnect;
    private _shardresume;
    private _sharddisconnect;
    private _restart;
    private _mastereval;
    private _restartall;
    private _fetchuser;
    private _fetchguild;
    private _fetchchannel;
    private _fetch;
    private _debug;
}
