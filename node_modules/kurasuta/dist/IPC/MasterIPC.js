"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterIPC = void 0;
const events_1 = require("events");
const veza_1 = require("veza");
const discord_js_1 = require("discord.js");
const cluster_1 = __importDefault(require("cluster"));
const Constants_1 = require("../Util/Constants");
class MasterIPC extends events_1.EventEmitter {
    constructor(manager) {
        super();
        this.manager = manager;
        this.server = new veza_1.Server('Master')
            .on('connect', client => this.emit('debug', `Client Connected: ${client.name}`))
            .on('disconnect', client => this.emit('debug', `Client Disconnected: ${client.name}`))
            .on('error', error => this.emit('error', error))
            .on('message', this._incommingMessage.bind(this));
        if (cluster_1.default.isPrimary)
            void this.server.listen(manager.ipcSocket);
    }
    async broadcast(code) {
        const data = await this.server.broadcast({ op: Constants_1.IPCEvents.EVAL, d: code });
        let errored = data.filter(res => !res.success);
        if (errored.length) {
            errored = errored.map(msg => msg.d);
            const error = errored[0];
            throw discord_js_1.Util.makeError(error);
        }
        return data.map(res => res.d);
    }
    _incommingMessage(message) {
        const { op } = message.data;
        this[`_${Constants_1.IPCEvents[op].toLowerCase()}`](message);
    }
    _message(message) {
        const { d } = message.data;
        this.manager.emit(Constants_1.SharderEvents.MESSAGE, d);
    }
    async _broadcast(message) {
        const { d } = message.data;
        try {
            const data = await this.broadcast(d);
            message.reply({ success: true, d: data });
        }
        catch (error) {
            if (!(error instanceof Error))
                return;
            message.reply({ success: false, d: { name: error.name, message: error.message, stack: error.stack } });
        }
    }
    _ready(message) {
        const { d: id } = message.data;
        const cluster = this.manager.clusters.get(id);
        cluster.emit('ready');
        this._debug(`Cluster ${id} became ready`);
        this.manager.emit(Constants_1.SharderEvents.READY, cluster);
    }
    _shardready(message) {
        const { d: { shardID } } = message.data;
        this._debug(`Shard ${shardID} became ready`);
        this.manager.emit(Constants_1.SharderEvents.SHARD_READY, shardID);
    }
    _shardreconnect(message) {
        const { d: { shardID } } = message.data;
        this._debug(`Shard ${shardID} tries to reconnect`);
        this.manager.emit(Constants_1.SharderEvents.SHARD_RECONNECT, shardID);
    }
    _shardresume(message) {
        const { d: { shardID, replayed } } = message.data;
        this._debug(`Shard ${shardID} resumed connection`);
        this.manager.emit(Constants_1.SharderEvents.SHARD_RESUME, replayed, shardID);
    }
    _sharddisconnect(message) {
        const { d: { shardID, closeEvent } } = message.data;
        this._debug(`Shard ${shardID} disconnected!`);
        this.manager.emit(Constants_1.SharderEvents.SHARD_DISCONNECT, closeEvent, shardID);
    }
    _restart(message) {
        const { d: clusterID } = message.data;
        return this.manager.restart(clusterID)
            .then(() => message.reply({ success: true }))
            .catch(error => message.reply({ success: false, d: { name: error.name, message: error.message, stack: error.stack } }));
    }
    async _mastereval(message) {
        const { d } = message.data;
        try {
            const result = await this.manager.eval(d);
            return message.reply({ success: true, d: result });
        }
        catch (error) {
            if (!(error instanceof Error))
                return;
            return message.reply({ success: false, d: { name: error.name, message: error.message, stack: error.stack } });
        }
    }
    async _restartall() {
        await this.manager.restartAll();
    }
    async _fetchuser(message) {
        return this._fetch(message, 'const user = this.users.cache.get(\'{id}\'); user ? user.toJSON() : user;');
    }
    async _fetchguild(message) {
        return this._fetch(message, 'const guild = this.guilds.cache.get(\'{id}\'); guild ? guild.toJSON() : guild;');
    }
    _fetchchannel(message) {
        return this._fetch(message, 'const channel = this.channels.cache.get(\'{id}\'); channel ? channel.toJSON() : channel;');
    }
    async _fetch(message, code) {
        const { d: id } = message.data;
        const result = await this.broadcast(code.replace('{id}', id));
        const realResult = result.filter(r => r);
        if (realResult.length) {
            return message.reply({ success: true, d: realResult[0] });
        }
        return message.reply({ success: false });
    }
    _debug(message) {
        this.emit(Constants_1.SharderEvents.DEBUG, message);
    }
}
exports.MasterIPC = MasterIPC;

//# sourceMappingURL=MasterIPC.js.map
