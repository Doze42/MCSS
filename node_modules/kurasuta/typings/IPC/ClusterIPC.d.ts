/// <reference types="node" />
import { EventEmitter } from 'events';
import { Client as VezaClient, ClientSocket } from 'veza';
import { Client } from 'discord.js';
export interface IPCRequest {
    op: number;
    d: string;
}
export declare class ClusterIPC extends EventEmitter {
    id: number;
    socket: string | number;
    clientSocket?: ClientSocket;
    client: Client | typeof Client;
    node: VezaClient;
    constructor(discordClient: Client | typeof Client, id: number, socket: string | number);
    broadcast(script: string | Function): Promise<unknown[]>;
    masterEval(script: string | Function): Promise<unknown>;
    init(): Promise<void>;
    get server(): ClientSocket;
    private _eval;
    private _message;
}
