/// <reference types="node" />
import { Client, ClientOptions } from 'discord.js';
import { MasterIPC } from '../IPC/MasterIPC';
import { Cluster } from '../Cluster/Cluster';
import { SharderEvents } from '../Util/Constants';
import { EventEmitter } from 'events';
export interface SharderOptions {
    token?: string;
    shardCount?: number | 'auto';
    clusterCount?: number;
    name?: string;
    development?: boolean;
    client?: typeof Client;
    clientOptions?: ClientOptions;
    guildsPerShard?: number;
    respawn?: boolean;
    ipcSocket?: string | number;
    timeout?: number;
    retry?: boolean;
    nodeArgs?: Array<string>;
}
export interface SessionObject {
    url: string;
    shards: number;
    session_start_limit: {
        total: number;
        remaining: number;
        reset_after: number;
    };
}
export interface CloseEvent {
    code: number;
    reason: string;
    wasClean: boolean;
}
export declare class ShardingManager extends EventEmitter {
    path: string;
    clusters: Map<number, Cluster>;
    clientOptions: ClientOptions;
    shardCount: number | 'auto';
    guildsPerShard: number;
    client: typeof Client;
    clusterCount: number;
    ipcSocket: string | number;
    respawn: boolean;
    timeout: number;
    retry: boolean;
    nodeArgs?: Array<string>;
    ipc: MasterIPC;
    private readonly development;
    private readonly token?;
    constructor(path: string, options: SharderOptions);
    spawn(): Promise<void>;
    restartAll(): Promise<void>;
    restart(clusterID: number): Promise<void>;
    fetchClientValues(prop: string): Promise<unknown[]>;
    eval(script: string): Promise<unknown>;
    on(event: SharderEvents.DEBUG, listener: (message: string) => void): this;
    on(event: SharderEvents.MESSAGE, listener: (message: unknown) => void): this;
    on(event: SharderEvents.READY | SharderEvents.SPAWN, listener: (cluster: Cluster) => void): this;
    on(event: SharderEvents.SHARD_READY | SharderEvents.SHARD_RECONNECT, listener: (shardID: number) => void): this;
    on(event: SharderEvents.SHARD_RESUME, listener: (replayed: number, shardID: number) => void): this;
    on(event: SharderEvents.SHARD_DISCONNECT, listener: (closeEvent: CloseEvent, shardID: number) => void): this;
    once(event: SharderEvents.DEBUG, listener: (message: string) => void): this;
    once(event: SharderEvents.MESSAGE, listener: (message: unknown) => void): this;
    once(event: SharderEvents.READY | SharderEvents.SPAWN, listener: (cluster: Cluster) => void): this;
    once(event: SharderEvents.SHARD_READY | SharderEvents.SHARD_RECONNECT, listener: (shardID: number) => void): this;
    once(event: SharderEvents.SHARD_RESUME, listener: (replayed: number, shardID: number) => void): this;
    once(event: SharderEvents.SHARD_DISCONNECT, listener: (closeEvent: CloseEvent, shardID: number) => void): this;
    private retryFailed;
    private _fetchSessionEndpoint;
    private _debug;
}
