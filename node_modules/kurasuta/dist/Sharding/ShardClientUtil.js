"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShardClientUtil = void 0;
const discord_js_1 = require("discord.js");
const ClusterIPC_1 = require("../IPC/ClusterIPC");
const Constants_1 = require("../Util/Constants");
class ShardClientUtil {
    constructor(client, ipcSocket) {
        this.client = client;
        this.ipcSocket = ipcSocket;
        this.clusterCount = Number(process.env.CLUSTER_CLUSTER_COUNT);
        this.shardCount = Number(process.env.CLUSTER_SHARD_COUNT);
        this.id = Number(process.env.CLUSTER_ID);
        this.ipc = new ClusterIPC_1.ClusterIPC(this.client, this.id, this.ipcSocket);
        this.shards = String(process.env.CLUSTER_SHARDS).split(',');
    }
    broadcastEval(script) {
        return this.ipc.broadcast(script);
    }
    masterEval(script) {
        return this.ipc.masterEval(script);
    }
    fetchClientValues(prop) {
        return this.ipc.broadcast(`this.${prop}`);
    }
    async fetchGuild(id) {
        const { success, d } = await this.send({ op: Constants_1.IPCEvents.FETCHGUILD, d: id });
        if (!success)
            throw new Error('No guild with this id found!');
        return d;
    }
    async fetchUser(id) {
        const { success, d } = await this.send({ op: Constants_1.IPCEvents.FETCHUSER, d: id });
        if (!success)
            throw new Error('No user with this id found!');
        return d;
    }
    async fetchChannel(id) {
        const { success, d } = await this.send({ op: Constants_1.IPCEvents.FETCHCHANNEL, d: id });
        if (!success)
            throw new Error('No channel with this id found!');
        return d;
    }
    async restartAll() {
        await this.ipc.server.send({ op: Constants_1.IPCEvents.RESTARTALL }, { receptive: false });
    }
    async restart(clusterID) {
        const { success, d } = await this.ipc.server.send({ op: Constants_1.IPCEvents.RESTART, d: clusterID });
        if (!success)
            throw discord_js_1.Util.makeError(d);
    }
    respawnAll() {
        return this.restartAll();
    }
    send(data, options) {
        if (typeof data === 'object' && data.op !== undefined)
            return this.ipc.server.send(data, options);
        return this.ipc.server.send({ op: Constants_1.IPCEvents.MESSAGE, d: data }, options);
    }
    init() {
        return this.ipc.init();
    }
}
exports.ShardClientUtil = ShardClientUtil;

//# sourceMappingURL=ShardClientUtil.js.map
