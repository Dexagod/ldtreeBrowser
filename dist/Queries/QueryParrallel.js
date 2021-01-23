"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryParrallel = void 0;
const events_1 = require("events");
const Parser_1 = require("../Parser");
const PromiseQueue = require("easy-promise-queue").default;
class QueryParrallel extends events_1.EventEmitter {
    constructor(parser, baseURI, tasks = 1) {
        super();
        this.processedIds = [];
        this.terminated = false;
        if (parser === null || parser === undefined) {
            this.parser = new Parser_1.Parser();
        }
        else {
            this.parser = parser;
        }
        this.baseURI = baseURI;
        this.taskqueue = new PromiseQueue({ concurrency: 1 });
    }
    query(collectionId, value, session = null) {
        return __awaiter(this, void 0, void 0, function* () {
            let runningQueries = [];
            if (session !== null) {
                let nodes = session.nodes;
                for (let node of nodes) {
                    if (this.terminated) {
                        runningQueries.push([node]);
                    }
                    else {
                        runningQueries.push(yield this.followChildWithValue(node.currentNodeId, node.relationValue, value, node.level));
                    }
                }
            }
            else {
                // let results = await this.processId(collectionId)
                let results = yield this.addTask(this.taskqueue, this.processIdTask, collectionId, this);
                session = {};
                session.nodes = new Array();
                for (let collection of results.collections) {
                    if (collection.id === collectionId) {
                        for (let viewRootNodeId of collection.views) {
                            runningQueries.push(yield this.recursiveQueryNodeInitial(viewRootNodeId, value, this.getInitialSearchValue(), 0, results));
                        }
                    }
                }
            }
            yield Promise.all(runningQueries);
            let nodeList = [];
            for (let nodes of yield (runningQueries)) {
                for (let node of yield (nodes)) {
                    nodeList.push(yield (node));
                }
            }
            session.nodes = nodeList;
            return session;
        });
    }
    recursiveQueryNodeInitial(currentNodeId, value, followedValue, level, results) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.handleEmittingMembers(results, currentNodeId, followedValue, level);
            return yield this.followChildRelations(currentNodeId, results.nodes, value, followedValue, level + 1);
        });
    }
    recursiveQueryNode(currentNodeId, value, followedValue, level) {
        return __awaiter(this, void 0, void 0, function* () {
            // let results = await this.processId(currentNodeId)
            let results = yield this.addTask(this.taskqueue, this.processIdTask, currentNodeId, this);
            if (results === null) {
                return [{ currentNodeId: currentNodeId, value: value, relationValue: followedValue, level: level }];
            }
            yield this.handleEmittingMembers(results, currentNodeId, followedValue, level);
            return yield this.followChildRelations(currentNodeId, results.nodes, value, followedValue, level + 1);
        });
    }
    // async processId(id : any){
    //   if (this.terminated || this.processedIds.indexOf(id) !== -1) { return null }
    //   return await this.parser.process(id)
    // }
    processIdTask(id, query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (query.terminated || query.processedIds.indexOf(id) !== -1) {
                return null;
            }
            let processed = yield query.parser.process(id);
            query.processedIds.push(id);
            return processed;
        });
    }
    handleEmittingMembers(results, searchedNodeId, nodeValue, level) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let node of results.nodes) {
                if (node.id === searchedNodeId) {
                    node.level = level;
                    node.value = nodeValue;
                    this.emit("node", node);
                }
            }
            this.emit("data", results);
        });
    }
    addTask(taskqueue, fct, ...args) {
        return new Promise(function (resolve, reject) {
            taskqueue.add(() => {
                return new Promise(function (resolve, reject) {
                    fct(...args).then((e) => resolve(e));
                }).then((e) => { resolve(e); });
            });
        });
    }
    getInitialSearchValue() {
        return null;
    }
    interrupt() {
        this.terminated = true;
    }
}
exports.QueryParrallel = QueryParrallel;
//# sourceMappingURL=QueryParrallel.js.map