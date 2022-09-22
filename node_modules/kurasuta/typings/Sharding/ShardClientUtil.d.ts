import { Client } from 'discord.js';
import { ClusterIPC } from '../IPC/ClusterIPC';
import { SendOptions } from 'veza';
export interface IPCResult {
    success: boolean;
    d: unknown;
}
export interface IPCError {
    name: string;
    message: string;
    stack: string;
}
export declare class ShardClientUtil {
    client: Client | typeof Client;
    ipcSocket: string | number;
    readonly clusterCount: number;
    readonly shardCount: number;
    readonly id: number;
    readonly ipc: ClusterIPC;
    readonly shards: string[];
    constructor(client: Client | typeof Client, ipcSocket: string | number);
    broadcastEval(script: string | Function): Promise<unknown[]>;
    masterEval(script: string | Function): Promise<unknown>;
    fetchClientValues(prop: string): Promise<unknown[]>;
    fetchGuild(id: string): Promise<object>;
    fetchUser(id: string): Promise<object>;
    fetchChannel(id: string): Promise<object>;
    restartAll(): Promise<void>;
    restart(clusterID: number): Promise<void>;
    respawnAll(): Promise<void>;
    send(data: any, options?: SendOptions): Promise<unknown>;
    init(): Promise<void>;
}
